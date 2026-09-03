// Financial Reports — PROMPT 137.
//
// Six report types from Prompt 41 wireframe:
//   P&L (Profit & Loss)  — revenue vs expenses, net profit, margins (bps)
//   Sales                — orders by period, top customers, payment breakdown
//   Expense              — by category, by period
//   Cash Flow            — non-credit inflow vs outflow, net, running balance
//   Customer             — receivables drill-down, per-customer history
//   Inventory            — stock levels, low-stock, stock movement by period
//
// All monetary amounts: integer paise.  Margins: basis points (integer).
// All reports accept a date range; all support drill-down via optional sub-filters.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
}

// ── P&L Report ────────────────────────────────────────────────────────────────

export interface PLReport {
  businessId: string;
  period: DateRange;
  revenueInPaise: number;
  costOfGoodsSoldInPaise: number;
  grossProfitInPaise: number;
  grossMarginBps: number;
  operatingExpensesInPaise: number;
  netProfitInPaise: number;
  netMarginBps: number;
  /** Drill-down: revenue broken out by payment method */
  revenueByPaymentMethod: Record<string, number>;
  /** Drill-down: expenses broken out by category */
  expensesByCategory: Record<string, number>;
}

// ── Sales Report ──────────────────────────────────────────────────────────────

export interface SalesReport {
  businessId: string;
  period: DateRange;
  totalSalesInPaise: number;
  totalOrderCount: number;
  averageOrderValueInPaise: number;
  topCustomers: Array<{ customerId: string | null; customerName: string; totalInPaise: number; orderCount: number }>;
  byPaymentMethod: Record<string, number>;
  /** Drill-down: daily buckets */
  dailySeries: Array<{ date: string; salesInPaise: number; orderCount: number }>;
}

// ── Expense Report ────────────────────────────────────────────────────────────

export interface ExpenseReport {
  businessId: string;
  period: DateRange;
  totalExpensesInPaise: number;
  expenseCount: number;
  byCategory: Record<string, number>;
  /** Drill-down: daily buckets */
  dailySeries: Array<{ date: string; expensesInPaise: number; expenseCount: number }>;
  /** Top-5 categories by amount */
  topCategories: Array<{ category: string; totalInPaise: number; shareBps: number }>;
}

// ── Cash Flow Report ──────────────────────────────────────────────────────────

export interface CashFlowReport {
  businessId: string;
  period: DateRange;
  totalInflowInPaise: number;
  totalOutflowInPaise: number;
  netCashFlowInPaise: number;
  /** Drill-down: daily series with running balance */
  dailySeries: Array<{
    date: string;
    inflowInPaise: number;
    outflowInPaise: number;
    netInPaise: number;
    runningBalanceInPaise: number;
  }>;
}

// ── Customer Report ───────────────────────────────────────────────────────────

export interface CustomerReport {
  businessId: string;
  period: DateRange;
  totalReceivablesInPaise: number;
  customersWithBalance: number;
  topReceivables: Array<{
    customerId: string;
    customerName: string;
    creditBalanceInPaise: number;
    totalPurchasedInPaise: number;
    orderCount: number;
  }>;
}

// ── Inventory Report ──────────────────────────────────────────────────────────

export interface InventoryReport {
  businessId: string;
  generatedAt: Date;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  products: Array<{
    productId: string;
    name: string;
    sku: string | null;
    stock: number;
    lowStockThreshold: number | null;
    priceInPaise: number;
    stockValueInPaise: number;
    isLowStock: boolean;
    isOutOfStock: boolean;
  }>;
  /** Drill-down: units sold per product in the given period */
  salesMovement: Array<{ productId: string; name: string; unitsSold: number }>;
}

// ── Non-credit payment methods ─────────────────────────────────────────────

const CASH_METHODS = [PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertBusiness(businessId: string): Promise<void> {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) throw new NotFoundException('Business not found');
  }

  // ── P&L Report ─────────────────────────────────────────────────────────────

  async getPLReport(businessId: string, range: DateRange): Promise<PLReport> {
    await this.assertBusiness(businessId);

    const [orders, expenses] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: { businessId, date: { gte: range.from, lte: range.to } },
        select: {
          totalInPaise: true,
          paymentMethod: true,
          items: { select: { quantity: true, unitPriceInPaise: true, totalInPaise: true, product: { select: { costPriceInPaise: true } } } },
        },
      }),
      this.prisma.expense.findMany({
        where: { businessId, date: { gte: range.from, lte: range.to } },
        select: { amountInPaise: true, category: true },
      }),
    ]);

    const revenueInPaise = orders.reduce((s, o) => s + o.totalInPaise, 0);

    // COGS: sum of (costPrice × quantity) for items with known cost price
    const costOfGoodsSoldInPaise = orders.reduce((s, o) =>
      s + o.items.reduce((si, item) =>
        si + (item.product?.costPriceInPaise ?? 0) * item.quantity, 0), 0);

    const grossProfitInPaise = revenueInPaise - costOfGoodsSoldInPaise;
    const grossMarginBps = revenueInPaise > 0
      ? Math.round((grossProfitInPaise / revenueInPaise) * 10000)
      : 0;

    const operatingExpensesInPaise = expenses.reduce((s, e) => s + e.amountInPaise, 0);
    const netProfitInPaise = grossProfitInPaise - operatingExpensesInPaise;
    const netMarginBps = revenueInPaise > 0
      ? Math.round((netProfitInPaise / revenueInPaise) * 10000)
      : 0;

    const revenueByPaymentMethod: Record<string, number> = {};
    for (const o of orders) {
      revenueByPaymentMethod[o.paymentMethod] =
        (revenueByPaymentMethod[o.paymentMethod] ?? 0) + o.totalInPaise;
    }

    const expensesByCategory: Record<string, number> = {};
    for (const e of expenses) {
      expensesByCategory[e.category] = (expensesByCategory[e.category] ?? 0) + e.amountInPaise;
    }

    return {
      businessId,
      period: range,
      revenueInPaise,
      costOfGoodsSoldInPaise,
      grossProfitInPaise,
      grossMarginBps,
      operatingExpensesInPaise,
      netProfitInPaise,
      netMarginBps,
      revenueByPaymentMethod,
      expensesByCategory,
    };
  }

  // ── Sales Report ────────────────────────────────────────────────────────────

  async getSalesReport(businessId: string, range: DateRange): Promise<SalesReport> {
    await this.assertBusiness(businessId);

    const orders = await this.prisma.saleOrder.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to } },
      select: {
        totalInPaise: true,
        paymentMethod: true,
        date: true,
        customerId: true,
        customer: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const totalSalesInPaise = orders.reduce((s, o) => s + o.totalInPaise, 0);
    const totalOrderCount = orders.length;
    const averageOrderValueInPaise = totalOrderCount > 0
      ? Math.round(totalSalesInPaise / totalOrderCount)
      : 0;

    // Top customers
    const custMap = new Map<string | null, { name: string; total: number; count: number }>();
    for (const o of orders) {
      const key = o.customerId;
      const cur = custMap.get(key) ?? { name: o.customer?.name ?? 'Walk-in', total: 0, count: 0 };
      cur.total += o.totalInPaise;
      cur.count += 1;
      custMap.set(key, cur);
    }
    const topCustomers = [...custMap.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([customerId, v]) => ({
        customerId,
        customerName: v.name,
        totalInPaise: v.total,
        orderCount: v.count,
      }));

    // Payment method breakdown
    const byPaymentMethod: Record<string, number> = {};
    for (const o of orders) {
      byPaymentMethod[o.paymentMethod] = (byPaymentMethod[o.paymentMethod] ?? 0) + o.totalInPaise;
    }

    // Daily series
    const dayMap = new Map<string, { sales: number; count: number }>();
    for (const o of orders) {
      const key = o.date.toISOString().slice(0, 10);
      const cur = dayMap.get(key) ?? { sales: 0, count: 0 };
      cur.sales += o.totalInPaise;
      cur.count += 1;
      dayMap.set(key, cur);
    }
    const dailySeries = [...dayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, salesInPaise: v.sales, orderCount: v.count }));

    return {
      businessId,
      period: range,
      totalSalesInPaise,
      totalOrderCount,
      averageOrderValueInPaise,
      topCustomers,
      byPaymentMethod,
      dailySeries,
    };
  }

  // ── Expense Report ──────────────────────────────────────────────────────────

  async getExpenseReport(businessId: string, range: DateRange): Promise<ExpenseReport> {
    await this.assertBusiness(businessId);

    const expenses = await this.prisma.expense.findMany({
      where: { businessId, date: { gte: range.from, lte: range.to } },
      select: { amountInPaise: true, category: true, date: true },
      orderBy: { date: 'asc' },
    });

    const totalExpensesInPaise = expenses.reduce((s, e) => s + e.amountInPaise, 0);
    const expenseCount = expenses.length;

    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amountInPaise;
    }

    const topCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, total]) => ({
        category,
        totalInPaise: total,
        shareBps: totalExpensesInPaise > 0
          ? Math.round((total / totalExpensesInPaise) * 10000)
          : 0,
      }));

    const dayMap = new Map<string, { exp: number; count: number }>();
    for (const e of expenses) {
      const key = e.date.toISOString().slice(0, 10);
      const cur = dayMap.get(key) ?? { exp: 0, count: 0 };
      cur.exp += e.amountInPaise;
      cur.count += 1;
      dayMap.set(key, cur);
    }
    const dailySeries = [...dayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, expensesInPaise: v.exp, expenseCount: v.count }));

    return {
      businessId,
      period: range,
      totalExpensesInPaise,
      expenseCount,
      byCategory,
      dailySeries,
      topCategories,
    };
  }

  // ── Cash Flow Report ────────────────────────────────────────────────────────

  async getCashFlowReport(businessId: string, range: DateRange): Promise<CashFlowReport> {
    await this.assertBusiness(businessId);

    const [orders, expenses] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: {
          businessId,
          date: { gte: range.from, lte: range.to },
          paymentMethod: { in: CASH_METHODS },
        },
        select: { totalInPaise: true, date: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: { businessId, date: { gte: range.from, lte: range.to } },
        select: { amountInPaise: true, date: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Build a map of all dates that appear in either orders or expenses
    const allDates = new Set<string>([
      ...orders.map(o => o.date.toISOString().slice(0, 10)),
      ...expenses.map(e => e.date.toISOString().slice(0, 10)),
    ]);

    const inflowByDay = new Map<string, number>();
    for (const o of orders) {
      const key = o.date.toISOString().slice(0, 10);
      inflowByDay.set(key, (inflowByDay.get(key) ?? 0) + o.totalInPaise);
    }
    const outflowByDay = new Map<string, number>();
    for (const e of expenses) {
      const key = e.date.toISOString().slice(0, 10);
      outflowByDay.set(key, (outflowByDay.get(key) ?? 0) + e.amountInPaise);
    }

    let runningBalance = 0;
    const dailySeries = [...allDates]
      .sort()
      .map(date => {
        const inflowInPaise = inflowByDay.get(date) ?? 0;
        const outflowInPaise = outflowByDay.get(date) ?? 0;
        const netInPaise = inflowInPaise - outflowInPaise;
        runningBalance += netInPaise;
        return { date, inflowInPaise, outflowInPaise, netInPaise, runningBalanceInPaise: runningBalance };
      });

    const totalInflowInPaise = orders.reduce((s, o) => s + o.totalInPaise, 0);
    const totalOutflowInPaise = expenses.reduce((s, e) => s + e.amountInPaise, 0);

    return {
      businessId,
      period: range,
      totalInflowInPaise,
      totalOutflowInPaise,
      netCashFlowInPaise: totalInflowInPaise - totalOutflowInPaise,
      dailySeries,
    };
  }

  // ── Customer Report ─────────────────────────────────────────────────────────

  async getCustomerReport(businessId: string, range: DateRange): Promise<CustomerReport> {
    await this.assertBusiness(businessId);

    const [customers, orders] = await Promise.all([
      this.prisma.customer.findMany({
        where: { businessId, isActive: true, creditBalance: { gt: 0 } },
        select: { id: true, name: true, creditBalance: true },
        orderBy: { creditBalance: 'desc' },
      }),
      this.prisma.saleOrder.findMany({
        where: { businessId, date: { gte: range.from, lte: range.to }, customerId: { not: null } },
        select: { customerId: true, totalInPaise: true },
      }),
    ]);

    const totalReceivablesInPaise = customers.reduce((s, c) => s + c.creditBalance, 0);

    // Aggregate purchases per customer within the period
    const purchaseMap = new Map<string, { total: number; count: number }>();
    for (const o of orders) {
      if (!o.customerId) continue;
      const cur = purchaseMap.get(o.customerId) ?? { total: 0, count: 0 };
      cur.total += o.totalInPaise;
      cur.count += 1;
      purchaseMap.set(o.customerId, cur);
    }

    const topReceivables = customers.map(c => ({
      customerId: c.id,
      customerName: c.name,
      creditBalanceInPaise: c.creditBalance,
      totalPurchasedInPaise: purchaseMap.get(c.id)?.total ?? 0,
      orderCount: purchaseMap.get(c.id)?.count ?? 0,
    }));

    return {
      businessId,
      period: range,
      totalReceivablesInPaise,
      customersWithBalance: customers.length,
      topReceivables,
    };
  }

  // ── Inventory Report ────────────────────────────────────────────────────────

  async getInventoryReport(businessId: string, range: DateRange): Promise<InventoryReport> {
    await this.assertBusiness(businessId);

    const [products, soldItems] = await Promise.all([
      this.prisma.product.findMany({
        where: { businessId, isActive: true },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          lowStockThreshold: true,
          priceInPaise: true,
        },
        orderBy: { stock: 'asc' },
      }),
      // Drill-down: units sold per product within the period
      this.prisma.saleOrderItem.groupBy({
        by: ['productId'],
        where: { saleOrder: { businessId, date: { gte: range.from, lte: range.to } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
      }),
    ]);

    const soldMap = new Map(soldItems.map(si => [si.productId, si._sum.quantity ?? 0]));

    // Resolve product names for the movement drill-down
    const productNameMap = new Map(products.map(p => [p.id, p.name]));

    const lowStockCount = products.filter(p =>
      p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold).length;
    const outOfStockCount = products.filter(p => p.stock <= 0).length;

    return {
      businessId,
      generatedAt: new Date(),
      totalProducts: products.length,
      lowStockCount,
      outOfStockCount,
      products: products.map(p => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        priceInPaise: p.priceInPaise,
        stockValueInPaise: p.stock * p.priceInPaise,
        isLowStock: p.lowStockThreshold !== null && p.stock <= p.lowStockThreshold,
        isOutOfStock: p.stock <= 0,
      })),
      salesMovement: soldItems.map(si => ({
        productId: si.productId,
        name: productNameMap.get(si.productId) ?? 'Unknown',
        unitsSold: si._sum.quantity ?? 0,
      })),
    };
  }

  /** @deprecated stub kept for backwards-compat; use specific report methods */
  findAll(): unknown[] {
    return [];
  }
}
