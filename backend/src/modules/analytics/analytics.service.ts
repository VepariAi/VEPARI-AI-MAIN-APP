// Daily summary aggregation — all amounts in paise (integer).

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DailySummary {
  date: string;                // YYYY-MM-DD
  salesInPaise: number;
  expensesInPaise: number;
  profitInPaise: number;
  salesCount: number;
  expensesCount: number;
  totalReceivableInPaise: number;  // snapshot at query time
  totalPayableInPaise: number;     // snapshot at query time
  topCustomers: Array<{ name: string; amountInPaise: number }>;
  paymentMethodBreakdown: Record<string, number>; // method -> paise
}

export interface BusinessSnapshot {
  today: {
    salesInPaise: number;
    expensesInPaise: number;
    profitInPaise: number;
    salesCount: number;
  };
  totalReceivableInPaise: number;
  totalPayableInPaise: number;
  alertCount: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySummary(businessId: string, date: string): Promise<DailySummary> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const [orders, expenses, customers, suppliers] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: { businessId, date: { gte: dayStart, lte: dayEnd } },
        select: { totalInPaise: true, paymentMethod: true, customer: { select: { name: true } } },
      }),
      this.prisma.expense.findMany({
        where: { businessId, date: { gte: dayStart, lte: dayEnd } },
        select: { amountInPaise: true },
      }),
      this.prisma.customer.aggregate({
        where: { businessId, isActive: true, creditBalance: { gt: 0 } },
        _sum: { creditBalance: true },
      }),
      this.prisma.supplier.aggregate({
        where: { businessId, isActive: true, payableBalance: { gt: 0 } },
        _sum: { payableBalance: true },
      }),
    ]);

    const salesInPaise = orders.reduce((s, o) => s + o.totalInPaise, 0);
    const expensesInPaise = expenses.reduce((s, e) => s + e.amountInPaise, 0);

    // Payment method breakdown
    const breakdown: Record<string, number> = {};
    for (const o of orders) {
      breakdown[o.paymentMethod] = (breakdown[o.paymentMethod] ?? 0) + o.totalInPaise;
    }

    // Top customers by sale amount today
    const customerTotals = new Map<string, number>();
    for (const o of orders) {
      if (!o.customer) continue;
      customerTotals.set(o.customer.name, (customerTotals.get(o.customer.name) ?? 0) + o.totalInPaise);
    }
    const topCustomers = [...customerTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amountInPaise]) => ({ name, amountInPaise }));

    return {
      date,
      salesInPaise,
      expensesInPaise,
      profitInPaise: salesInPaise - expensesInPaise,
      salesCount: orders.length,
      expensesCount: expenses.length,
      totalReceivableInPaise: customers._sum.creditBalance ?? 0,
      totalPayableInPaise: suppliers._sum.payableBalance ?? 0,
      topCustomers,
      paymentMethodBreakdown: breakdown,
    };
  }

  async getBusinessSnapshot(businessId: string): Promise<BusinessSnapshot> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const [orders, expenses, receivable, payable] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        where: { businessId, date: { gte: dayStart, lte: dayEnd } },
        _sum: { totalInPaise: true },
        _count: { id: true },
      }),
      this.prisma.expense.aggregate({
        where: { businessId, date: { gte: dayStart, lte: dayEnd } },
        _sum: { amountInPaise: true },
      }),
      this.prisma.customer.aggregate({
        where: { businessId, isActive: true, creditBalance: { gt: 0 } },
        _sum: { creditBalance: true },
      }),
      this.prisma.supplier.aggregate({
        where: { businessId, isActive: true, payableBalance: { gt: 0 } },
        _sum: { payableBalance: true },
      }),
    ]);

    const salesInPaise = orders._sum.totalInPaise ?? 0;
    const expensesInPaise = expenses._sum.amountInPaise ?? 0;

    return {
      today: {
        salesInPaise,
        expensesInPaise,
        profitInPaise: salesInPaise - expensesInPaise,
        salesCount: orders._count.id,
      },
      totalReceivableInPaise: receivable._sum.creditBalance ?? 0,
      totalPayableInPaise: payable._sum.payableBalance ?? 0,
      alertCount: 0, // populated by alert engine in PROMPT 109
    };
  }
}
