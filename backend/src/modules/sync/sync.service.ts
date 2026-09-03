import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod } from '@prisma/client';

export type MutationType = 'CREATE_SALE' | 'CREATE_EXPENSE' | 'ADJUST_CREDIT' | 'ADJUST_PAYABLE' | 'ADJUST_STOCK';

export interface SyncMutation {
  id: string;
  type: MutationType;
  payload: Record<string, unknown>;
  createdAt: number; // epoch ms
}

export interface SyncResult {
  accepted: string[];
  rejected: Array<{ id: string; reason: string }>;
  timestamp: number;
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async applyMutations(businessId: string, mutations: SyncMutation[]): Promise<SyncResult> {
    if (mutations.length > 100) {
      throw new BadRequestException('Max 100 mutations per sync batch');
    }

    const accepted: string[] = [];
    const rejected: Array<{ id: string; reason: string }> = [];

    for (const m of mutations) {
      try {
        await this.applyOne(businessId, m);
        accepted.push(m.id);
      } catch (err) {
        rejected.push({
          id: m.id,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Upsert checkpoint after batch
    await this.prisma.syncCheckpoint.upsert({
      where: { businessId_deviceId: { businessId, deviceId: 'default' } },
      create: { businessId, deviceId: 'default', lastSyncAt: new Date(), checkpoint: {} },
      update: { lastSyncAt: new Date() },
    });

    return { accepted, rejected, timestamp: Date.now() };
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
