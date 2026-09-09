// Offline mutation push + pull with idempotency — Prompts 150-157.
// Idempotency: client-supplied mutation IDs are stored in the SyncCheckpoint
// JSON blob so duplicate deliveries are silently accepted without re-applying.
// Pull: returns recent server-side changes since a client-provided cursor.

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

export type MutationType = 'CREATE_SALE' | 'CREATE_EXPENSE' | 'ADJUST_CREDIT' | 'ADJUST_PAYABLE' | 'ADJUST_STOCK';

export interface SyncMutation {
  id: string;                        // client-generated idempotency key (UUIDv4)
  type: MutationType;
  payload: Record<string, unknown>;
  createdAt: number;                 // epoch ms (client clock)
}

export interface SyncResult {
  accepted: string[];
  rejected: Array<{ id: string; reason: string }>;
  serverCursor: number;              // epoch ms — client stores and sends on next push
  timestamp: number;
}

export interface SyncPullResult {
  changes: SyncChange[];
  cursor: number;                    // advance the client cursor to this value
}

export interface SyncChange {
  entity: 'sale' | 'expense' | 'customer' | 'supplier' | 'product' | 'transaction';
  id: string;
  serverUpdatedAt: number;           // epoch ms
  data: Record<string, unknown>;
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Push (mutations from device) ─────────────────────────────────────────

  async applyMutations(
    businessId: string,
    deviceId: string,
    mutations: SyncMutation[],
  ): Promise<SyncResult> {
    if (mutations.length > 100) {
      throw new BadRequestException('Max 100 mutations per sync batch');
    }

    // Load (or create) device checkpoint and extract already-applied IDs
    const checkpoint = await this.loadCheckpoint(businessId, deviceId);
    const appliedIds: Set<string> = new Set(checkpoint.appliedMutationIds ?? []);

    const accepted: string[] = [];
    const rejected: Array<{ id: string; reason: string }> = [];

    for (const m of mutations) {
      if (appliedIds.has(m.id)) {
        // Idempotent re-delivery — accept without re-applying
        accepted.push(m.id);
        continue;
      }
      try {
        await this.applyOne(businessId, m);
        accepted.push(m.id);
        appliedIds.add(m.id);
      } catch (err) {
        rejected.push({
          id: m.id,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Persist checkpoint — keep at most last 500 IDs to bound JSON size
    const trimmedIds = Array.from(appliedIds).slice(-500);
    const serverCursor = Date.now();
    await this.saveCheckpoint(businessId, deviceId, trimmedIds, serverCursor);

    return { accepted, rejected, serverCursor, timestamp: serverCursor };
  }

  // ── Pull (changes from server since cursor) ───────────────────────────────

  async pullChanges(businessId: string, since: number): Promise<SyncPullResult> {
    const sinceDate = new Date(since);
    const now = new Date();

    const [sales, expenses, customers, suppliers, products] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: { businessId, createdAt: { gt: sinceDate } },
        select: { id: true, totalInPaise: true, paymentMethod: true, date: true,
                  notes: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      this.prisma.expense.findMany({
        where: { businessId, createdAt: { gt: sinceDate } },
        select: { id: true, amountInPaise: true, category: true, description: true,
                  paymentMethod: true, date: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      this.prisma.customer.findMany({
        where: { businessId, updatedAt: { gt: sinceDate } },
        select: { id: true, name: true, creditBalance: true, phone: true, updatedAt: true },
        orderBy: { updatedAt: 'asc' },
        take: 200,
      }),
      this.prisma.supplier.findMany({
        where: { businessId, updatedAt: { gt: sinceDate } },
        select: { id: true, name: true, payableBalance: true, phone: true, updatedAt: true },
        orderBy: { updatedAt: 'asc' },
        take: 200,
      }),
      this.prisma.product.findMany({
        where: { businessId, updatedAt: { gt: sinceDate } },
        select: { id: true, name: true, stock: true, priceInPaise: true,
                  lowStockThreshold: true, updatedAt: true },
        orderBy: { updatedAt: 'asc' },
        take: 200,
      }),
    ]);

    const changes: SyncChange[] = [
      ...sales.map(s => ({
        entity: 'sale' as const,
        id: s.id,
        serverUpdatedAt: s.createdAt.getTime(),
        data: s as Record<string, unknown>,
      })),
      ...expenses.map(e => ({
        entity: 'expense' as const,
        id: e.id,
        serverUpdatedAt: e.createdAt.getTime(),
        data: e as Record<string, unknown>,
      })),
      ...customers.map(c => ({
        entity: 'customer' as const,
        id: c.id,
        serverUpdatedAt: c.updatedAt.getTime(),
        data: c as Record<string, unknown>,
      })),
      ...suppliers.map(s => ({
        entity: 'supplier' as const,
        id: s.id,
        serverUpdatedAt: s.updatedAt.getTime(),
        data: s as Record<string, unknown>,
      })),
      ...products.map(p => ({
        entity: 'product' as const,
        id: p.id,
        serverUpdatedAt: p.updatedAt.getTime(),
        data: p as Record<string, unknown>,
      })),
    ];

    changes.sort((a, b) => a.serverUpdatedAt - b.serverUpdatedAt);

    return { changes, cursor: now.getTime() };
  }

  // ── Checkpoint helpers ────────────────────────────────────────────────────

  private async loadCheckpoint(
    businessId: string,
    deviceId: string,
  ): Promise<{ appliedMutationIds?: string[] }> {
    const row = await this.prisma.syncCheckpoint.findUnique({
      where: { businessId_deviceId: { businessId, deviceId } },
    });
    if (!row) return {};
    return (row.checkpoint ?? {}) as { appliedMutationIds?: string[] };
  }

  private async saveCheckpoint(
    businessId: string,
    deviceId: string,
    appliedMutationIds: string[],
    cursorMs: number,
  ): Promise<void> {
    const data = { appliedMutationIds, cursorMs };
    await this.prisma.syncCheckpoint.upsert({
      where: { businessId_deviceId: { businessId, deviceId } },
      create: { businessId, deviceId, lastSyncAt: new Date(cursorMs), checkpoint: data },
      update: { lastSyncAt: new Date(cursorMs), checkpoint: data },
    });
  }

  private async applyOne(businessId: string, m: SyncMutation): Promise<void> {
    const p = m.payload;

    switch (m.type) {
      case 'CREATE_SALE': {
        const totalInPaise = Number(p['totalInPaise']);
        if (!totalInPaise || totalInPaise <= 0) throw new Error('Invalid sale total');
        await this.prisma.$transaction([
          this.prisma.saleOrder.create({
            data: {
              businessId,
              totalInPaise,
              paymentMethod: (p['paymentMethod'] as PaymentMethod) ?? PaymentMethod.CASH,
              date: p['date'] ? new Date(p['date'] as string) : new Date(),
              notes: (p['notes'] as string) ?? null,
            },
          }),
          this.prisma.transaction.create({
            data: {
              businessId,
              type: 'SALE',
              amountInPaise: totalInPaise,
              paymentMethod: (p['paymentMethod'] as PaymentMethod) ?? PaymentMethod.CASH,
              date: p['date'] ? new Date(p['date'] as string) : new Date(),
              description: 'Offline sale',
            },
          }),
        ]);
        break;
      }

      case 'CREATE_EXPENSE': {
        const amountInPaise = Number(p['amountInPaise']);
        if (!amountInPaise || amountInPaise <= 0) throw new Error('Invalid expense amount');
        await this.prisma.$transaction([
          this.prisma.expense.create({
            data: {
              businessId,
              category: (p['category'] as string) ?? 'other',
              amountInPaise,
              description: (p['description'] as string) ?? null,
              notes: (p['notes'] as string) ?? null,
              paymentMethod: (p['paymentMethod'] as PaymentMethod) ?? PaymentMethod.CASH,
              date: p['date'] ? new Date(p['date'] as string) : new Date(),
            },
          }),
          this.prisma.transaction.create({
            data: {
              businessId,
              type: 'EXPENSE',
              amountInPaise,
              paymentMethod: (p['paymentMethod'] as PaymentMethod) ?? PaymentMethod.CASH,
              date: p['date'] ? new Date(p['date'] as string) : new Date(),
              description: (p['description'] as string) ?? 'Offline expense',
            },
          }),
        ]);
        break;
      }

      case 'ADJUST_CREDIT': {
        const customerId = p['customerId'] as string;
        const delta = Number(p['amountInPaise']);
        if (!customerId) throw new Error('customerId required');
        const customer = await this.prisma.customer.findFirst({ where: { id: customerId, businessId } });
        if (!customer) throw new Error('Customer not found');
        await this.prisma.customer.update({
          where: { id: customerId },
          data: { creditBalance: { increment: delta } },
        });
        break;
      }

      case 'ADJUST_PAYABLE': {
        const supplierId = p['supplierId'] as string;
        const delta = Number(p['amountInPaise']);
        if (!supplierId) throw new Error('supplierId required');
        const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, businessId } });
        if (!supplier) throw new Error('Supplier not found');
        await this.prisma.supplier.update({
          where: { id: supplierId },
          data: { payableBalance: { increment: delta } },
        });
        break;
      }

      case 'ADJUST_STOCK': {
        const productId = p['productId'] as string;
        const adjustment = Number(p['adjustment']);
        if (!productId) throw new Error('productId required');
        const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
        if (!product) throw new Error('Product not found');
        const newStock = product.stock + adjustment;
        if (newStock < 0) throw new Error('Stock cannot go below zero');
        await this.prisma.product.update({
          where: { id: productId },
          data: { stock: newStock },
        });
        break;
      }

      default:
        throw new Error(`Unknown mutation type: ${m.type as string}`);
    }
  }
}
