// AI OS Briefing Engine — TRD §13–14.
//
// Generates the "while you were away" brief from REAL events that occurred
// since the caller-supplied checkpoint timestamp.  No event is fabricated;
// every BriefingItem carries the raw database evidence that produced it.
//
// Priority tiers (per Prompt 24):
//   Critical    — requires immediate action (stock-out, large payable overdue, cash alert)
//   Important   — significant but not urgent (new large sale, new customer, supplier bill)
//   Actionable  — worth acting on soon (low stock, uncollected credit, payment received)
//   Informational — FYI (expense logged, sale completed below threshold)
//
// Event categories (per Screens.png):
//   sales | expenses | new_customers | payments | supplier_bills | stock_alerts | opportunities

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Public types ─────────────────────────────────────────────────────────────

export type BriefingPriority = 'critical' | 'important' | 'actionable' | 'informational';
export type BriefingCategory =
  | 'sales'
  | 'expenses'
  | 'new_customers'
  | 'payments'
  | 'supplier_bills'
  | 'stock_alerts'
  | 'opportunities';

export interface BriefingItem {
  priority: BriefingPriority;
  category: BriefingCategory;
  title: string;
  description: string;
  /** Raw database evidence — never fabricated */
  evidence: Record<string, unknown>;
}

export interface Briefing {
  businessId: string;
  since: Date;
  generatedAt: Date;
  /** Items sorted: critical → important → actionable → informational */
  items: BriefingItem[];
  summary: {
    totalItems: number;
    criticalCount: number;
    importantCount: number;
    actionableCount: number;
    informationalCount: number;
  };
}

// ── Priority ordering ─────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<BriefingPriority, number> = {
  critical: 0,
  important: 1,
  actionable: 2,
  informational: 3,
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class BriefingService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBriefing(businessId: string, since: Date): Promise<Briefing> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const now = new Date();

    const [saleOrders, expenses, newCustomers, lowStockProducts, suppliers] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: { businessId, createdAt: { gt: since } },
        select: {
          id: true,
          totalInPaise: true,
          paymentMethod: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { businessId, createdAt: { gt: since } },
        select: { id: true, amountInPaise: true, category: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.findMany({
        where: { businessId, createdAt: { gt: since }, isActive: true },
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.findMany({
        where: {
          businessId,
          isActive: true,
          lowStockThreshold: { not: null },
          stock: { lte: 10 },
        },
        select: { id: true, name: true, stock: true, lowStockThreshold: true },
        orderBy: { stock: 'asc' },
      }),
      this.prisma.supplier.findMany({
        where: { businessId, isActive: true, payableBalance: { gt: 0 } },
        select: { id: true, name: true, payableBalance: true },
        orderBy: { payableBalance: 'desc' },
        take: 5,
      }),
    ]);

    const items: BriefingItem[] = [
      ...this.buildSaleItems(saleOrders),
      ...this.buildExpenseItems(expenses),
      ...this.buildNewCustomerItems(newCustomers),
      ...this.buildStockAlerts(lowStockProducts),
      ...this.buildSupplierBillItems(suppliers),
      ...this.buildOpportunities(saleOrders, newCustomers),
    ];

    // Sort by priority tier (critical first), then by creation recency
    items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

    const summary = {
      totalItems: items.length,
      criticalCount: items.filter(i => i.priority === 'critical').length,
      importantCount: items.filter(i => i.priority === 'important').length,
      actionableCount: items.filter(i => i.priority === 'actionable').length,
      informationalCount: items.filter(i => i.priority === 'informational').length,
    };

    return { businessId, since, generatedAt: now, items, summary };
  }

  // ── Sales ─────────────────────────────────────────────────────────────────

  private buildSaleItems(
    orders: Array<{
      id: string;
      totalInPaise: number;
      paymentMethod: string;
      createdAt: Date;
      customer: { id: string; name: string } | null;
    }>,
  ): BriefingItem[] {
    if (orders.length === 0) return [];

    const totalInPaise = orders.reduce((s, o) => s + o.totalInPaise, 0);
    const largeOrders = orders.filter(o => o.totalInPaise >= 100000); // ≥ ₹1 000

    const items: BriefingItem[] = [];

    // Summary item for all sales
    if (orders.length > 0) {
      items.push({
        priority: 'informational',
        category: 'sales',
        title: `${orders.length} new sale${orders.length > 1 ? 's' : ''} totalling ₹${(totalInPaise / 100).toFixed(0)}`,
        description: `${orders.length} sale order${orders.length > 1 ? 's' : ''} recorded since your last check, totalling ₹${(totalInPaise / 100).toFixed(0)}.`,
        evidence: {
          orderCount: orders.length,
          totalInPaise,
          largeOrderCount: largeOrders.length,
        },
      });
    }

    // Individual important items for large orders
    for (const order of largeOrders) {
      items.push({
        priority: 'important',
        category: 'sales',
        title: `Large sale: ₹${(order.totalInPaise / 100).toFixed(0)}${order.customer ? ` to ${order.customer.name}` : ''}`,
        description: `A sale of ₹${(order.totalInPaise / 100).toFixed(0)} was recorded at ${order.createdAt.toISOString()}.`,
        evidence: {
          orderId: order.id,
          totalInPaise: order.totalInPaise,
          paymentMethod: order.paymentMethod,
          customerId: order.customer?.id ?? null,
          customerName: order.customer?.name ?? null,
          createdAt: order.createdAt.toISOString(),
        },
      });
    }

    return items;
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  private buildExpenseItems(
    expenses: Array<{ id: string; amountInPaise: number; category: string; createdAt: Date }>,
  ): BriefingItem[] {
    if (expenses.length === 0) return [];

    const totalInPaise = expenses.reduce((s, e) => s + e.amountInPaise, 0);

    return [
      {
        priority: 'informational',
        category: 'expenses',
        title: `${expenses.length} expense${expenses.length > 1 ? 's' : ''} logged — ₹${(totalInPaise / 100).toFixed(0)}`,
        description: `${expenses.length} expense record${expenses.length > 1 ? 's' : ''} added since your last check, totalling ₹${(totalInPaise / 100).toFixed(0)}.`,
        evidence: {
          expenseCount: expenses.length,
          totalInPaise,
          categories: [...new Set(expenses.map(e => e.category))],
        },
      },
    ];
  }

  // ── New customers ─────────────────────────────────────────────────────────

  private buildNewCustomerItems(
    customers: Array<{ id: string; name: string; createdAt: Date }>,
  ): BriefingItem[] {
    if (customers.length === 0) return [];

    return customers.map(c => ({
      priority: 'important' as BriefingPriority,
      category: 'new_customers' as BriefingCategory,
      title: `New customer: ${c.name}`,
      description: `${c.name} was added as a new customer at ${c.createdAt.toISOString()}.`,
      evidence: {
        customerId: c.id,
        customerName: c.name,
        createdAt: c.createdAt.toISOString(),
      },
    }));
  }

  // ── Stock alerts ──────────────────────────────────────────────────────────

  private buildStockAlerts(
    products: Array<{ id: string; name: string; stock: number; lowStockThreshold: number | null }>,
  ): BriefingItem[] {
    return products.map(p => ({
      priority: (p.stock <= 0 ? 'critical' : 'actionable') as BriefingPriority,
      category: 'stock_alerts' as BriefingCategory,
      title: p.stock <= 0
        ? `STOCK OUT: ${p.name} has no stock`
        : `Low stock: ${p.name} (${p.stock} left)`,
      description: p.stock <= 0
        ? `${p.name} is completely out of stock. New sales for this product will fail.`
        : `${p.name} has only ${p.stock} unit${p.stock !== 1 ? 's' : ''} remaining (threshold: ${p.lowStockThreshold ?? 'not set'}).`,
      evidence: {
        productId: p.id,
        productName: p.name,
        currentStock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
      },
    }));
  }

  // ── Supplier bills ────────────────────────────────────────────────────────

  private buildSupplierBillItems(
    suppliers: Array<{ id: string; name: string; payableBalance: number }>,
  ): BriefingItem[] {
    return suppliers
      .filter(s => s.payableBalance >= 50000) // Only surface significant amounts (≥ ₹500)
      .map(s => ({
        priority: (s.payableBalance >= 500000 ? 'critical' : 'important') as BriefingPriority,
        category: 'supplier_bills' as BriefingCategory,
        title: `₹${(s.payableBalance / 100).toFixed(0)} owed to ${s.name}`,
        description: `You have an outstanding payable of ₹${(s.payableBalance / 100).toFixed(0)} with ${s.name}.`,
        evidence: {
          supplierId: s.id,
          supplierName: s.name,
          payableBalanceInPaise: s.payableBalance,
        },
      }));
  }

  // ── Opportunities ─────────────────────────────────────────────────────────

  private buildOpportunities(
    orders: Array<{ totalInPaise: number; paymentMethod: string }>,
    newCustomers: Array<{ id: string }>,
  ): BriefingItem[] {
    const items: BriefingItem[] = [];

    // If business got new customers AND made sales: cross-sell opportunity
    if (newCustomers.length > 0 && orders.length > 0) {
      const avgSaleInPaise = Math.round(
        orders.reduce((s, o) => s + o.totalInPaise, 0) / orders.length,
      );
      items.push({
        priority: 'actionable',
        category: 'opportunities',
        title: `Follow up with ${newCustomers.length} new customer${newCustomers.length > 1 ? 's' : ''}`,
        description: `You gained ${newCustomers.length} new customer${newCustomers.length > 1 ? 's' : ''} while you were away. Average sale value this period was ₹${(avgSaleInPaise / 100).toFixed(0)}.`,
        evidence: {
          newCustomerCount: newCustomers.length,
          saleCount: orders.length,
          avgSaleInPaise,
        },
      });
    }

    return items;
  }
}
