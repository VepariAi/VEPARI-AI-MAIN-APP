// Finance service — all monetary arithmetic uses integer paise.
// Never use float for INR amounts.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod, TransactionType } from '@prisma/client';

export interface TransactionRow {
  id: string;
  type: TransactionType;
  amountInPaise: number;
  description: string | null;
  date: Date;
  paymentMethod: PaymentMethod;
}

export interface ProfitSummary {
  /** All amounts in paise (integer) */
  salesInPaise: number;
  expensesInPaise: number;
  profitInPaise: number;
  grossMarginBps: number; // basis points (1/100 of a percent) — no float
  periodStart: Date;
  periodEnd: Date;
}

export interface DailySummary extends ProfitSummary {
  date: string; // YYYY-MM-DD
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

function computeMarginBps(salesInPaise: number, expensesInPaise: number): number {
  if (salesInPaise === 0) return 0;
  // profit / sales * 10000 (basis points) — stays integer via Math.round
  return Math.round(((salesInPaise - expensesInPaise) * 10000) / salesInPaise);
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitSummary(businessId: string, from: Date, to: Date): Promise<ProfitSummary> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const [salesAgg, expensesAgg] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        where: { businessId, date: { gte: from, lte: to } },
        _sum: { totalInPaise: true },
      }),
      this.prisma.expense.aggregate({
        where: { businessId, date: { gte: from, lte: to } },
        _sum: { amountInPaise: true },
      }),
    ]);

    const salesInPaise = salesAgg._sum.totalInPaise ?? 0;
    const expensesInPaise = expensesAgg._sum.amountInPaise ?? 0;
    const profitInPaise = salesInPaise - expensesInPaise;

    return {
      salesInPaise,
      expensesInPaise,
      profitInPaise,
      grossMarginBps: computeMarginBps(salesInPaise, expensesInPaise),
      periodStart: from,
      periodEnd: to,
    };
  }

  async getTodayProfit(businessId: string): Promise<ProfitSummary> {
    const today = new Date();
    return this.getProfitSummary(businessId, startOfDay(today), endOfDay(today));
  }

  async getWeekProfit(businessId: string): Promise<ProfitSummary> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    return this.getProfitSummary(businessId, startOfDay(weekAgo), endOfDay(today));
  }

  async getMonthProfit(businessId: string): Promise<ProfitSummary> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.getProfitSummary(businessId, startOfDay(monthStart), endOfDay(today));
  }

  async getDailySeries(businessId: string, days = 30): Promise<DailySummary[]> {
    const today = new Date();
    const results: DailySummary[] = [];

    // Fetch all sale orders and expenses in one batch, then aggregate in-process
    const from = new Date(today);
    from.setDate(today.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const [orders, expenses] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: { businessId, date: { gte: from } },
        select: { date: true, totalInPaise: true },
      }),
      this.prisma.expense.findMany({
        where: { businessId, date: { gte: from } },
        select: { date: true, amountInPaise: true },
      }),
    ]);

    // Group by YYYY-MM-DD
    const salesByDay = new Map<string, number>();
    for (const o of orders) {
      const key = o.date.toISOString().slice(0, 10);
      salesByDay.set(key, (salesByDay.get(key) ?? 0) + o.totalInPaise);
    }

    const expensesByDay = new Map<string, number>();
    for (const e of expenses) {
      const key = e.date.toISOString().slice(0, 10);
      expensesByDay.set(key, (expensesByDay.get(key) ?? 0) + e.amountInPaise);
    }

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const salesInPaise = salesByDay.get(key) ?? 0;
      const expensesInPaise = expensesByDay.get(key) ?? 0;
      results.push({
        date: key,
        salesInPaise,
        expensesInPaise,
        profitInPaise: salesInPaise - expensesInPaise,
        grossMarginBps: computeMarginBps(salesInPaise, expensesInPaise),
        periodStart: startOfDay(d),
        periodEnd: endOfDay(d),
      });
    }

    return results;
  }

  async listTransactions(businessId: string, limit = 50, offset = 0): Promise<TransactionRow[]> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    return this.prisma.transaction.findMany({
      where: { businessId },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      select: { id: true, type: true, amountInPaise: true, description: true, date: true, paymentMethod: true },
    });
  }
}
