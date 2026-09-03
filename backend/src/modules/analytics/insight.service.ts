// Insight engine — four detection types per AI OS.txt §43–46.
//
// §43 Trend:     directional movement in a metric over time (sales, expenses, profit)
// §44 Anomaly:   value deviates > 2 σ from the rolling mean (Chebyshev safe-guard)
// §45 Opportunity: actionable positive signal (e.g. top customer credit uncollected,
//                  fast-moving product running low, expense category 30% below prior period)
// §46 Risk:      actionable negative signal (e.g. cash outflow > inflow, stock-out imminent,
//                overdue receivables, expense spike)
//
// All monetary amounts handled as integer paise throughout.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Public types ─────────────────────────────────────────────────────────────

export type InsightType = 'trend' | 'anomaly' | 'opportunity' | 'risk';
export type InsightSeverity = 'info' | 'warning' | 'critical';

export interface Insight {
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  /** Raw evidence that produced this insight — never fabricated */
  evidence: Record<string, unknown>;
}

export interface InsightReport {
  businessId: string;
  generatedAt: Date;
  trends: Insight[];
  anomalies: Insight[];
  opportunities: Insight[];
  risks: Insight[];
}

// ── Internal helpers ─────────────────────────────────────────────────────────

interface DailyBucket {
  date: string;  // YYYY-MM-DD
  salesInPaise: number;
  expensesInPaise: number;
  count: number;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Simple linear regression slope (paise per day)
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const v = values[i] ?? 0;
    num += (i - xMean) * (v - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// Basis-point growth rate: (current - prior) / prior * 10000
function growthBps(current: number, prior: number): number {
  if (prior === 0) return 0;
  return Math.round(((current - prior) / prior) * 10000);
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class InsightService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInsights(businessId: string): Promise<InsightReport> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [orders, expenses, customers, suppliers, products] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where: { businessId, date: { gte: thirtyDaysAgo } },
        select: { totalInPaise: true, date: true, paymentMethod: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: { businessId, date: { gte: thirtyDaysAgo } },
        select: { amountInPaise: true, date: true, category: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.customer.findMany({
        where: { businessId, isActive: true, creditBalance: { gt: 0 } },
        select: { id: true, name: true, creditBalance: true },
        orderBy: { creditBalance: 'desc' },
        take: 10,
      }),
      this.prisma.supplier.findMany({
        where: { businessId, isActive: true, payableBalance: { gt: 0 } },
        select: { id: true, name: true, payableBalance: true },
        orderBy: { payableBalance: 'desc' },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: {
          businessId,
          isActive: true,
          lowStockThreshold: { not: null },
          stock: { lte: 10 },
        },
        select: { id: true, name: true, stock: true, lowStockThreshold: true },
      }),
    ]);

    // Build daily buckets (last 30 days)
    const bucketMap = new Map<string, DailyBucket>();
    for (const o of orders) {
      const key = o.date.toISOString().slice(0, 10);
      const b = bucketMap.get(key) ?? { date: key, salesInPaise: 0, expensesInPaise: 0, count: 0 };
      b.salesInPaise += o.totalInPaise;
      b.count += 1;
      bucketMap.set(key, b);
    }
    for (const e of expenses) {
      const key = e.date.toISOString().slice(0, 10);
      const b = bucketMap.get(key) ?? { date: key, salesInPaise: 0, expensesInPaise: 0, count: 0 };
      b.expensesInPaise += e.amountInPaise;
      bucketMap.set(key, b);
    }
    const buckets: DailyBucket[] = [...bucketMap.values()].sort((a, b) => a.date.localeCompare(b.date));

    const insights: InsightReport = {
      businessId,
      generatedAt: now,
      trends: this.detectTrends(buckets),
      anomalies: this.detectAnomalies(buckets),
      opportunities: this.detectOpportunities(buckets, customers, products),
      risks: this.detectRisks(buckets, customers, suppliers, products, expenses),
    };

    return insights;
  }

  // ── §43 Trends ─────────────────────────────────────────────────────────────

  private detectTrends(buckets: DailyBucket[]): Insight[] {
    const insights: Insight[] = [];
    if (buckets.length < 7) return insights;

    const salesValues = buckets.map(b => b.salesInPaise);
    const expensesValues = buckets.map(b => b.expensesInPaise);

    const salesSlope = linearSlope(salesValues);
    const expSlope = linearSlope(expensesValues);

    // Split into two equal halves for period-over-period comparison
    const mid = Math.floor(buckets.length / 2);
    const firstHalf = buckets.slice(0, mid);
    const secondHalf = buckets.slice(mid);

    const firstHalfSales = firstHalf.reduce((s, b) => s + b.salesInPaise, 0);
    const secondHalfSales = secondHalf.reduce((s, b) => s + b.salesInPaise, 0);
    const firstHalfExp = firstHalf.reduce((s, b) => s + b.expensesInPaise, 0);
    const secondHalfExp = secondHalf.reduce((s, b) => s + b.expensesInPaise, 0);

    const salesGrowthBps = growthBps(secondHalfSales, firstHalfSales);
    const expGrowthBps = growthBps(secondHalfExp, firstHalfExp);

    if (Math.abs(salesGrowthBps) >= 500) {
      const direction = salesGrowthBps > 0 ? 'growing' : 'declining';
      insights.push({
        type: 'trend',
        severity: salesGrowthBps > 0 ? 'info' : 'warning',
        title: `Sales ${direction} over the past 30 days`,
        description: `Sales changed by ${(salesGrowthBps / 100).toFixed(1)}% comparing the recent half-month to the earlier half-month.`,
        evidence: {
          slopePerDay: Math.round(salesSlope),
          firstHalfSalesInPaise: firstHalfSales,
          secondHalfSalesInPaise: secondHalfSales,
          growthBps: salesGrowthBps,
        },
      });
    }

    if (expGrowthBps >= 1000) {
      insights.push({
        type: 'trend',
        severity: 'warning',
        title: 'Expenses rising significantly',
        description: `Expenses increased by ${(expGrowthBps / 100).toFixed(1)}% in the recent fortnight vs the prior fortnight.`,
        evidence: {
          slopePerDay: Math.round(expSlope),
          firstHalfExpInPaise: firstHalfExp,
          secondHalfExpInPaise: secondHalfExp,
          growthBps: expGrowthBps,
        },
      });
    }

    return insights;
  }

  // ── §44 Anomalies ──────────────────────────────────────────────────────────

  private detectAnomalies(buckets: DailyBucket[]): Insight[] {
    const insights: Insight[] = [];
    if (buckets.length < 5) return insights;

    // Use all but the last 3 days as the "baseline" window
    const baseline = buckets.slice(0, -3);
    const recent = buckets.slice(-3);

    for (const field of ['salesInPaise', 'expensesInPaise'] as const) {
      const baseValues = baseline.map(b => b[field]);
      const avg = mean(baseValues);
      const sd = stddev(baseValues, avg);

      for (const bucket of recent) {
        const value = bucket[field];
        if (value === avg) continue;

        // When sd = 0 (uniform baseline) any deviation is infinitely anomalous.
        // Cap the reported z-score at 10 to keep evidence readable.
        const zScore = sd === 0 ? 10 : Math.abs(value - avg) / sd;
        if (zScore >= 2) {
          const label = field === 'salesInPaise' ? 'Sales' : 'Expenses';
          const direction = value > avg ? 'spike' : 'drop';
          insights.push({
            type: 'anomaly',
            severity: zScore >= 3 ? 'critical' : 'warning',
            title: `${label} ${direction} detected on ${bucket.date}`,
            description: `${label} of ₹${(value / 100).toFixed(0)} on ${bucket.date} is ${zScore.toFixed(1)} standard deviations from the 30-day baseline of ₹${(avg / 100).toFixed(0)}.`,
            evidence: {
              date: bucket.date,
              valueInPaise: value,
              baselineMeanInPaise: avg,
              baselineStddevInPaise: Math.round(sd),
              zScore: parseFloat(zScore.toFixed(2)),
            },
          });
        }
      }
    }

    return insights;
  }

  // ── §45 Opportunities ──────────────────────────────────────────────────────

  private detectOpportunities(
    buckets: DailyBucket[],
    customers: Array<{ id: string; name: string; creditBalance: number }>,
    products: Array<{ id: string; name: string; stock: number; lowStockThreshold: number | null }>,
  ): Insight[] {
    const insights: Insight[] = [];

    // Opportunity 1: High-value uncollected receivables
    const topReceivable = customers[0];
    if (topReceivable && topReceivable.creditBalance >= 50000) {
      insights.push({
        type: 'opportunity',
        severity: 'info',
        title: `Collect ₹${(topReceivable.creditBalance / 100).toFixed(0)} from ${topReceivable.name}`,
        description: `${topReceivable.name} has the highest outstanding credit balance. Following up could improve cash flow.`,
        evidence: {
          customerId: topReceivable.id,
          customerName: topReceivable.name,
          creditBalanceInPaise: topReceivable.creditBalance,
          totalCustomersWithBalance: customers.length,
        },
      });
    }

    // Opportunity 2: Positive profit trend (good period)
    if (buckets.length >= 7) {
      const recent7 = buckets.slice(-7);
      const totalSales = recent7.reduce((s, b) => s + b.salesInPaise, 0);
      const totalExp = recent7.reduce((s, b) => s + b.expensesInPaise, 0);
      const profit = totalSales - totalExp;
      if (profit > 0 && totalSales > 0) {
        const marginBps = Math.round((profit / totalSales) * 10000);
        if (marginBps >= 2000) {
          insights.push({
            type: 'opportunity',
            severity: 'info',
            title: 'Strong profit margin this week',
            description: `Your profit margin over the last 7 days is ${(marginBps / 100).toFixed(1)}%, which is healthy. Consider reinvesting in high-selling products.`,
            evidence: {
              periodDays: 7,
              salesInPaise: totalSales,
              expensesInPaise: totalExp,
              profitInPaise: profit,
              marginBps,
            },
          });
        }
      }
    }

    // Opportunity 3: Low-stock products (restock prompt)
    const topLowStock = products[0];
    if (topLowStock) {
      insights.push({
        type: 'opportunity',
        severity: 'info',
        title: `Restock ${topLowStock.name} before stock-out`,
        description: `${topLowStock.name} has only ${topLowStock.stock} units remaining (threshold: ${topLowStock.lowStockThreshold ?? 'not set'}). Ordering now avoids lost sales.`,
        evidence: {
          productId: topLowStock.id,
          productName: topLowStock.name,
          currentStock: topLowStock.stock,
          lowStockThreshold: topLowStock.lowStockThreshold,
        },
      });
    }

    return insights;
  }

  // ── §46 Risks ──────────────────────────────────────────────────────────────

  private detectRisks(
    buckets: DailyBucket[],
    customers: Array<{ id: string; name: string; creditBalance: number }>,
    suppliers: Array<{ id: string; name: string; payableBalance: number }>,
    products: Array<{ id: string; name: string; stock: number; lowStockThreshold: number | null }>,
    expenses: Array<{ amountInPaise: number; date: Date; category: string }>,
  ): Insight[] {
    const insights: Insight[] = [];

    // Risk 1: Cash outflow > inflow over last 7 days
    if (buckets.length >= 7) {
      const recent7 = buckets.slice(-7);
      const sales7 = recent7.reduce((s, b) => s + b.salesInPaise, 0);
      const exp7 = recent7.reduce((s, b) => s + b.expensesInPaise, 0);
      if (exp7 > sales7 && exp7 > 0) {
        insights.push({
          type: 'risk',
          severity: 'warning',
          title: 'Expenses exceed sales this week',
          description: `Over the last 7 days, expenses (₹${(exp7 / 100).toFixed(0)}) exceeded sales (₹${(sales7 / 100).toFixed(0)}), resulting in a net loss of ₹${((exp7 - sales7) / 100).toFixed(0)}.`,
          evidence: {
            periodDays: 7,
            salesInPaise: sales7,
            expensesInPaise: exp7,
            netLossInPaise: exp7 - sales7,
          },
        });
      }
    }

    // Risk 2: Overdue receivables (total customer credit owed > 30 days typical)
    const totalReceivable = customers.reduce((s, c) => s + c.creditBalance, 0);
    if (totalReceivable >= 100000) {
      insights.push({
        type: 'risk',
        severity: totalReceivable >= 500000 ? 'critical' : 'warning',
        title: `₹${(totalReceivable / 100).toFixed(0)} in outstanding receivables`,
        description: `${customers.length} customer(s) owe a total of ₹${(totalReceivable / 100).toFixed(0)}. Uncollected receivables increase financial risk.`,
        evidence: {
          totalReceivableInPaise: totalReceivable,
          customerCount: customers.length,
          topCustomer: customers[0] ? { name: customers[0].name, balanceInPaise: customers[0].creditBalance } : null,
        },
      });
    }

    // Risk 3: High payables (supplier dues)
    const totalPayable = suppliers.reduce((s, sup) => s + sup.payableBalance, 0);
    if (totalPayable >= 100000) {
      insights.push({
        type: 'risk',
        severity: 'warning',
        title: `₹${(totalPayable / 100).toFixed(0)} owed to suppliers`,
        description: `You owe ₹${(totalPayable / 100).toFixed(0)} across ${suppliers.length} supplier(s). Delaying payment may affect supply relationships.`,
        evidence: {
          totalPayableInPaise: totalPayable,
          supplierCount: suppliers.length,
          topSupplier: suppliers[0] ? { name: suppliers[0].name, balanceInPaise: suppliers[0].payableBalance } : null,
        },
      });
    }

    // Risk 4: Expense category spike (any category > 50% of total expenses last 7 days)
    const recentExpenses = expenses.filter(e => {
      const daysAgo = (Date.now() - e.date.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });
    if (recentExpenses.length > 0) {
      const totalRecent = recentExpenses.reduce((s, e) => s + e.amountInPaise, 0);
      const byCat = new Map<string, number>();
      for (const e of recentExpenses) {
        byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amountInPaise);
      }
      for (const [cat, catTotal] of byCat.entries()) {
        const shareBps = Math.round((catTotal / totalRecent) * 10000);
        if (shareBps >= 5000) {
          insights.push({
            type: 'risk',
            severity: 'info',
            title: `${cat} is ${(shareBps / 100).toFixed(0)}% of recent expenses`,
            description: `The "${cat}" category accounts for ₹${(catTotal / 100).toFixed(0)} of the past week's ₹${(totalRecent / 100).toFixed(0)} in expenses. Review if this is expected.`,
            evidence: {
              category: cat,
              categoryTotalInPaise: catTotal,
              totalExpensesInPaise: totalRecent,
              shareBps,
            },
          });
        }
      }
    }

    // Risk 5: Products at zero or negative stock
    const zeroStock = products.filter(p => p.stock <= 0);
    if (zeroStock.length > 0) {
      insights.push({
        type: 'risk',
        severity: 'critical',
        title: `${zeroStock.length} product(s) are out of stock`,
        description: `${zeroStock.map(p => p.name).join(', ')} have zero or negative stock. Sales for these items will fail until restocked.`,
        evidence: {
          productCount: zeroStock.length,
          products: zeroStock.map(p => ({ id: p.id, name: p.name, stock: p.stock })),
        },
      });
    }

    return insights;
  }
}
