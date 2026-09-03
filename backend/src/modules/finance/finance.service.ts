// Finance service — all monetary arithmetic uses integer paise.
// Never use float for INR amounts.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethod, TransactionType } from '@prisma/client';

// ── BRS types ──────────────────────────────────────────────────────────────────

// ── Cash flow / receivables / payables types ───────────────────────────────

export interface CashFlowSummary {
  /** All amounts in paise (integer) */
  cashInflowInPaise: number;   // cash + UPI + card + bank sales
  cashOutflowInPaise: number;  // cash + UPI + card + bank expenses
  netCashFlowInPaise: number;  // inflow - outflow
  periodStart: Date;
  periodEnd: Date;
}

export interface ReceivablesPayablesSummary {
  /** Total positive customer credit balances (money customers owe us) — paise */
  totalReceivablesInPaise: number;
  /** Total positive supplier payable balances (money we owe suppliers) — paise */
  totalPayablesInPaise: number;
  /** Number of customers with outstanding balance */
  customersWithBalance: number;
  /** Number of suppliers with outstanding balance */
  suppliersWithBalance: number;
}

// ── BRS types ──────────────────────────────────────────────────────────────────

export interface BrsEntryInput {
  date: string; // ISO date string
  amountInPaise: number; // integer; positive = credit, negative = debit
  description?: string;
  reference?: string;
}

export interface BrsMatchResult {
  entryId: string;
  date: string;
  amountInPaise: number;
  description: string | null;
  reference: string | null;
  status: 'matched' | 'unmatched';
  matchedTransactionId: string | null;
  matchedAt: Date | null;
}

export interface BrsReconcileResult {
  importId: string;
  label: string;
  totalEntries: number;
  matchedCount: number;
  unmatchedCount: number;
  entries: BrsMatchResult[];
}

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

  // ── Cash flow ────────────────────────────────────────────────────────────

  async getCashFlowSummary(businessId: string, from: Date, to: Date): Promise<CashFlowSummary> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    // Non-credit payment methods represent actual cash movement
    const cashMethods = [PaymentMethod.CASH, PaymentMethod.UPI, PaymentMethod.BANK_TRANSFER, PaymentMethod.CARD];

    const [salesAgg, expensesAgg] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        where: {
          businessId,
          date: { gte: from, lte: to },
          paymentMethod: { in: cashMethods },
        },
        _sum: { totalInPaise: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          businessId,
          date: { gte: from, lte: to },
          paymentMethod: { in: cashMethods },
        },
        _sum: { amountInPaise: true },
      }),
    ]);

    const cashInflowInPaise = salesAgg._sum.totalInPaise ?? 0;
    const cashOutflowInPaise = expensesAgg._sum.amountInPaise ?? 0;

    return {
      cashInflowInPaise,
      cashOutflowInPaise,
      netCashFlowInPaise: cashInflowInPaise - cashOutflowInPaise,
      periodStart: from,
      periodEnd: to,
    };
  }

  async getCashFlowToday(businessId: string): Promise<CashFlowSummary> {
    const today = new Date();
    return this.getCashFlowSummary(businessId, startOfDay(today), endOfDay(today));
  }

  async getCashFlowMonth(businessId: string): Promise<CashFlowSummary> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    return this.getCashFlowSummary(businessId, startOfDay(monthStart), endOfDay(today));
  }

  // ── Receivables & Payables ────────────────────────────────────────────────

  async getReceivablesPayables(businessId: string): Promise<ReceivablesPayablesSummary> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const [customers, suppliers] = await Promise.all([
      this.prisma.customer.findMany({
        where: { businessId, isActive: true, creditBalance: { gt: 0 } },
        select: { creditBalance: true },
      }),
      this.prisma.supplier.findMany({
        where: { businessId, isActive: true, payableBalance: { gt: 0 } },
        select: { payableBalance: true },
      }),
    ]);

    const totalReceivablesInPaise = customers.reduce((sum, c) => sum + c.creditBalance, 0);
    const totalPayablesInPaise = suppliers.reduce((sum, s) => sum + s.payableBalance, 0);

    return {
      totalReceivablesInPaise,
      totalPayablesInPaise,
      customersWithBalance: customers.length,
      suppliersWithBalance: suppliers.length,
    };
  }

  // ── BRS (Bank Reconciliation) ─────────────────────────────────────────────

  async importBankStatement(
    businessId: string,
    label: string,
    entries: BrsEntryInput[],
  ): Promise<BrsReconcileResult> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    // Create the import record and entries in one transaction
    const brsImport = await this.prisma.$transaction(async (tx) => {
      const imp = await tx.bankStatementImport.create({
        data: { businessId, label },
      });
      if (entries.length > 0) {
        await tx.bankStatementEntry.createMany({
          data: entries.map((e) => ({
            importId: imp.id,
            date: new Date(e.date),
            amountInPaise: e.amountInPaise,
            description: e.description ?? null,
            reference: e.reference ?? null,
          })),
        });
      }
      return imp;
    });

    return this.reconcileImport(businessId, brsImport.id);
  }

  async reconcileImport(businessId: string, importId: string): Promise<BrsReconcileResult> {
    const brsImport = await this.prisma.bankStatementImport.findFirst({
      where: { id: importId, businessId },
    });
    if (!brsImport) throw new NotFoundException('Bank statement import not found');

    const rawEntries = await this.prisma.bankStatementEntry.findMany({
      where: { importId },
      orderBy: { date: 'asc' },
    });

    // Load business transactions within the date range covered by the statement
    const dates = rawEntries.map((e) => e.date);
    if (dates.length === 0) {
      return {
        importId,
        label: brsImport.label,
        totalEntries: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        entries: [],
      };
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    // Expand window by ±1 day to allow for timezone / posting-date differences
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        businessId,
        date: { gte: minDate, lte: maxDate },
        // Only bank-channel transactions are candidates for reconciliation
        paymentMethod: { in: [PaymentMethod.UPI, PaymentMethod.BANK_TRANSFER, PaymentMethod.CARD] },
      },
      select: { id: true, amountInPaise: true, date: true },
    });

    // Build a mutable pool so each transaction is matched at most once
    const txPool = transactions.map((t) => ({ ...t, used: false }));

    const updatedEntries: BrsMatchResult[] = [];

    for (const entry of rawEntries) {
      // Entry already matched from a previous reconcile run
      if (entry.matchedTransactionId) {
        updatedEntries.push(entryToResult(entry, 'matched'));
        continue;
      }

      // Find best candidate: same amount, date within ±1 day, not yet used
      const entryTime = entry.date.getTime();
      const DAY_MS = 86_400_000;
      const candidate = txPool.find(
        (t) =>
          !t.used &&
          Math.abs(t.amountInPaise) === Math.abs(entry.amountInPaise) &&
          Math.abs(t.date.getTime() - entryTime) <= DAY_MS,
      );

      if (candidate) {
        candidate.used = true;
        const matchedAt = new Date();
        await this.prisma.bankStatementEntry.update({
          where: { id: entry.id },
          data: { matchedTransactionId: candidate.id, matchedAt },
        });
        updatedEntries.push({
          entryId: entry.id,
          date: entry.date.toISOString().slice(0, 10),
          amountInPaise: entry.amountInPaise,
          description: entry.description,
          reference: entry.reference,
          status: 'matched',
          matchedTransactionId: candidate.id,
          matchedAt,
        });
      } else {
        updatedEntries.push(entryToResult(entry, 'unmatched'));
      }
    }

    const matchedCount = updatedEntries.filter((e) => e.status === 'matched').length;

    return {
      importId,
      label: brsImport.label,
      totalEntries: updatedEntries.length,
      matchedCount,
      unmatchedCount: updatedEntries.length - matchedCount,
      entries: updatedEntries,
    };
  }

  async listBankStatementImports(businessId: string): Promise<{ id: string; label: string; importedAt: Date; entryCount: number }[]> {
    const imports = await this.prisma.bankStatementImport.findMany({
      where: { businessId },
      orderBy: { importedAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
    return imports.map((i) => ({
      id: i.id,
      label: i.label,
      importedAt: i.importedAt,
      entryCount: i._count.entries,
    }));
  }
}

function entryToResult(
  entry: { id: string; date: Date; amountInPaise: number; description: string | null; reference: string | null; matchedTransactionId: string | null; matchedAt: Date | null },
  status: 'matched' | 'unmatched',
): BrsMatchResult {
  return {
    entryId: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    amountInPaise: entry.amountInPaise,
    description: entry.description,
    reference: entry.reference,
    status,
    matchedTransactionId: entry.matchedTransactionId,
    matchedAt: entry.matchedAt,
  };
}
