/**
 * Business Brain memory layer.
 *
 * Layer 1 — UserMemory: personal preferences and patterns, TTL 7 days.
 * Layer 2 — BusinessMemory: customer/supplier/product patterns and revenue
 *            trends, TTL 24 hours.
 *
 * Snapshots are stored as JSON in the database and injected into the AI chat
 * system prompt so the model has persistent, cross-session context.
 * AI never has direct DB access — it receives only the pre-computed snapshot.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const BUSINESS_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;  // 24 h
const USER_MEMORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days

export interface BusinessMemorySnapshot {
  topCustomers: Array<{ id: string; name: string; revenueInPaise: number; orderCount: number }>;
  topProducts: Array<{ id: string; name: string; unitsSold: number; revenueInPaise: number }>;
  topSuppliers: Array<{ id: string; name: string; purchasedInPaise: number }>;
  revenueTrend: { last7DaysInPaise: number; prev7DaysInPaise: number; changePercent: number };
  openReceivablesInPaise: number;
  openPayablesInPaise: number;
}

export interface UserMemorySnapshot {
  preferredLanguage: string;
  displayName: string;
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getBusinessMemory(businessId: string): Promise<BusinessMemorySnapshot> {
    const stored = await this.prisma.businessMemory.findUnique({ where: { businessId } });

    if (stored && Date.now() - stored.refreshedAt.getTime() < BUSINESS_MEMORY_TTL_MS) {
      return stored.snapshot as unknown as BusinessMemorySnapshot;
    }

    return this.refreshBusinessMemory(businessId);
  }

  async refreshBusinessMemory(businessId: string): Promise<BusinessMemorySnapshot> {
    const now = new Date();
    const last7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7Start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Resolve sale order IDs for product groupBy (SaleOrderItem has no businessId field)
    const recentSaleOrders = await this.prisma.saleOrder.findMany({
      where: { businessId, createdAt: { gte: last30Start } },
      select: { id: true },
    });
    const saleOrderIds = recentSaleOrders.map(o => o.id);

    const [
      topCustomerRows,
      topProductRows,
      topSupplierRows,
      last7Revenue,
      prev7Revenue,
      receivables,
      payables,
    ] = await Promise.all([
      this.prisma.saleOrder.groupBy({
        by: ['customerId'],
        where: { businessId, createdAt: { gte: last30Start }, customerId: { not: null } },
        _sum: { totalInPaise: true },
        _count: true,
        orderBy: { _sum: { totalInPaise: 'desc' } },
        take: 5,
      }),
      saleOrderIds.length > 0
        ? this.prisma.saleOrderItem.groupBy({
            by: ['productId'],
            where: { saleOrderId: { in: saleOrderIds } },
            _sum: { quantity: true, totalInPaise: true },
            orderBy: { _sum: { totalInPaise: 'desc' } },
            take: 5,
          })
        : Promise.resolve([]),
      this.prisma.purchase.groupBy({
        by: ['supplierId'],
        where: { businessId, createdAt: { gte: last30Start }, supplierId: { not: null } },
        _sum: { totalInPaise: true },
        orderBy: { _sum: { totalInPaise: 'desc' } },
        take: 5,
      }),
      this.prisma.saleOrder.aggregate({
        where: { businessId, createdAt: { gte: last7Start } },
        _sum: { totalInPaise: true },
      }),
      this.prisma.saleOrder.aggregate({
        where: { businessId, createdAt: { gte: prev7Start, lt: last7Start } },
        _sum: { totalInPaise: true },
      }),
      this.prisma.customer.aggregate({ where: { businessId }, _sum: { creditBalance: true } }),
      this.prisma.supplier.aggregate({ where: { businessId }, _sum: { payableBalance: true } }),
    ]);

    // Resolve customer names
    const customerIds = topCustomerRows
      .map(r => r.customerId)
      .filter((id): id is string => id !== null);
    const customers = customerIds.length > 0
      ? await this.prisma.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true } })
      : [];
    const customerMap = new Map(customers.map(c => [c.id, c.name]));

    // Resolve product names
    const productIds = topProductRows.map(r => r.productId);
    const products = productIds.length > 0
      ? await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
      : [];
    const productMap = new Map(products.map(p => [p.id, p.name]));

    // Resolve supplier names
    const supplierIds = topSupplierRows
      .map(r => r.supplierId)
      .filter((id): id is string => id !== null);
    const suppliers = supplierIds.length > 0
      ? await this.prisma.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } })
      : [];
    const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

    const last7 = last7Revenue._sum.totalInPaise ?? 0;
    const prev7 = prev7Revenue._sum.totalInPaise ?? 0;
    const changePercent = prev7 === 0 ? 0 : Math.round(((last7 - prev7) / prev7) * 100);

    const snapshot: BusinessMemorySnapshot = {
      topCustomers: topCustomerRows.map(r => ({
        id: r.customerId as string,
        name: customerMap.get(r.customerId as string) ?? 'Unknown',
        revenueInPaise: r._sum.totalInPaise ?? 0,
        orderCount: r._count,
      })),
      topProducts: topProductRows.map(r => ({
        id: r.productId,
        name: productMap.get(r.productId) ?? 'Unknown',
        unitsSold: r._sum.quantity ?? 0,
        revenueInPaise: r._sum.totalInPaise ?? 0,
      })),
      topSuppliers: topSupplierRows.map(r => ({
        id: r.supplierId as string,
        name: supplierMap.get(r.supplierId as string) ?? 'Unknown',
        purchasedInPaise: r._sum.totalInPaise ?? 0,
      })),
      revenueTrend: { last7DaysInPaise: last7, prev7DaysInPaise: prev7, changePercent },
      openReceivablesInPaise: receivables._sum.creditBalance ?? 0,
      openPayablesInPaise: payables._sum.payableBalance ?? 0,
    };

    await this.prisma.businessMemory.upsert({
      where: { businessId },
      create: { businessId, snapshot: snapshot as unknown as Prisma.InputJsonValue },
      update: { snapshot: snapshot as unknown as Prisma.InputJsonValue, refreshedAt: new Date() },
    });

    this.logger.log(`Refreshed business memory for ${businessId}`);
    return snapshot;
  }

  async getUserMemory(userId: string): Promise<UserMemorySnapshot> {
    const stored = await this.prisma.userMemory.findUnique({ where: { userId } });

    if (stored && Date.now() - stored.refreshedAt.getTime() < USER_MEMORY_TTL_MS) {
      return stored.snapshot as unknown as UserMemorySnapshot;
    }

    return this.refreshUserMemory(userId);
  }

  async refreshUserMemory(userId: string): Promise<UserMemorySnapshot> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, language: true },
    });

    const snapshot: UserMemorySnapshot = {
      preferredLanguage: user?.language ?? 'en',
      displayName: user?.name ?? 'Owner',
    };

    await this.prisma.userMemory.upsert({
      where: { userId },
      create: { userId, snapshot: snapshot as unknown as Prisma.InputJsonValue },
      update: { snapshot: snapshot as unknown as Prisma.InputJsonValue, refreshedAt: new Date() },
    });

    return snapshot;
  }

  formatBusinessMemoryForPrompt(mem: BusinessMemorySnapshot): string {
    const lines: string[] = ['--- Business Memory (last 30 days) ---'];

    if (mem.topCustomers.length > 0) {
      lines.push('Top customers: ' + mem.topCustomers
        .map(c => `${c.name} (₹${Math.round(c.revenueInPaise / 100)}, ${c.orderCount} orders)`)
        .join(', '));
    }
    if (mem.topProducts.length > 0) {
      lines.push('Top products: ' + mem.topProducts
        .map(p => `${p.name} (${p.unitsSold} units, ₹${Math.round(p.revenueInPaise / 100)})`)
        .join(', '));
    }
    if (mem.topSuppliers.length > 0) {
      lines.push('Top suppliers: ' + mem.topSuppliers
        .map(s => `${s.name} (₹${Math.round(s.purchasedInPaise / 100)})`)
        .join(', '));
    }

    const trend = mem.revenueTrend;
    const direction = trend.changePercent >= 0 ? 'up' : 'down';
    lines.push(`Revenue trend: ${direction} ${Math.abs(trend.changePercent)}% vs prior week`);
    lines.push(`Open receivables: ₹${Math.round(mem.openReceivablesInPaise / 100)}`);
    lines.push(`Open payables: ₹${Math.round(mem.openPayablesInPaise / 100)}`);

    return lines.join('\n');
  }
}
