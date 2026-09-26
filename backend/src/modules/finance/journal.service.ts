// Accounting journal service — PROMPT 127.
// Provides double-entry style ledger views over the existing Transaction model.
// No new DB tables needed — wraps and interprets existing records.
// All amounts in paise (integer). Never use float.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, PaymentMethod } from '@prisma/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  date: Date;
  type: TransactionType;
  /** Debit amount in paise (money out of cash/bank) */
  debitInPaise: number;
  /** Credit amount in paise (money into cash/bank) */
  creditInPaise: number;
  description: string | null;
  paymentMethod: PaymentMethod;
  referenceId: string | null;
  partyName?: string;
}

export interface LedgerAccount {
  accountName: string;
  entries: JournalEntry[];
  /** Running total: credits - debits */
  balanceInPaise: number;
}

export interface TrialBalance {
  businessId: string;
  periodStart: Date;
  periodEnd: Date;
  accounts: Array<{
    name: string;
    debitTotalInPaise: number;
    creditTotalInPaise: number;
    /** Net = credit - debit */
    netInPaise: number;
  }>;
  /** Must be zero for a balanced trial balance */
  debitTotalInPaise: number;
  creditTotalInPaise: number;
}

export interface ProfitAndLossStatement {
  businessId: string;
  periodStart: Date;
  periodEnd: Date;
  /** Revenue from sales in paise */
  revenueInPaise: number;
  /** Cost of purchases in paise */
  costOfGoodsInPaise: number;
  /** Gross profit = revenue - cost of goods */
  grossProfitInPaise: number;
  /** Operating expenses in paise */
  operatingExpensesInPaise: number;
  /** Net profit = gross profit - operating expenses */
  netProfitInPaise: number;
  /** Gross margin in basis points */
  grossMarginBps: number;
  /** Net margin in basis points */
  netMarginBps: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record a journal entry (wraps Transaction creation). */
  async recordEntry(businessId: string, params: {
    type: TransactionType;
    amountInPaise: number;
    description?: string;
    date?: Date;
    paymentMethod?: PaymentMethod;
    referenceId?: string;
    customerId?: string;
    supplierId?: string;
  }): Promise<JournalEntry> {
    const tx = await this.prisma.transaction.create({
      data: {
        businessId,
        type: params.type,
        amountInPaise: params.amountInPaise,
        description: params.description ?? null,
        date: params.date ?? new Date(),
        paymentMethod: params.paymentMethod ?? PaymentMethod.CASH,
        referenceId: params.referenceId ?? null,
        customerId: params.customerId ?? null,
        supplierId: params.supplierId ?? null,
      },
    });

    return this.mapToJournalEntry(tx);
  }

  /** Fetch all journal entries for a business in a period. */
  async getJournalEntries(businessId: string, from: Date, to: Date): Promise<JournalEntry[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { businessId, date: { gte: from, lte: to } },
      include: { customer: { select: { name: true } }, supplier: { select: { name: true } } },
      orderBy: { date: 'asc' },
    });

    return transactions.map(tx => this.mapToJournalEntry(tx, tx.customer?.name, tx.supplier?.name));
  }

  /** Build a ledger view grouped by transaction type. */
  async getLedger(businessId: string, from: Date, to: Date): Promise<LedgerAccount[]> {
    const entries = await this.getJournalEntries(businessId, from, to);

    const accounts = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const accountName = this.accountForType(entry.type);
      if (!accounts.has(accountName)) accounts.set(accountName, []);
      accounts.get(accountName)!.push(entry);
    }

    return Array.from(accounts.entries()).map(([accountName, acctEntries]) => ({
      accountName,
      entries: acctEntries,
      balanceInPaise: acctEntries.reduce((s, e) => s + e.creditInPaise - e.debitInPaise, 0),
    }));
  }

  /** Compute trial balance. */
  async getTrialBalance(businessId: string, from: Date, to: Date): Promise<TrialBalance> {
    const entries = await this.getJournalEntries(businessId, from, to);

    const accounts = new Map<string, { debit: number; credit: number }>();
    for (const e of entries) {
      const name = this.accountForType(e.type);
      const cur = accounts.get(name) ?? { debit: 0, credit: 0 };
      accounts.set(name, {
        debit: cur.debit + e.debitInPaise,
        credit: cur.credit + e.creditInPaise,
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;
    const accountRows = Array.from(accounts.entries()).map(([name, { debit, credit }]) => {
      totalDebit += debit;
      totalCredit += credit;
      return { name, debitTotalInPaise: debit, creditTotalInPaise: credit, netInPaise: credit - debit };
    });

    return {
      businessId,
      periodStart: from,
      periodEnd: to,
      accounts: accountRows,
      debitTotalInPaise: totalDebit,
      creditTotalInPaise: totalCredit,
    };
  }

  /** Build a P&L statement from sales, expenses, and purchases. */
  async getProfitAndLoss(businessId: string, from: Date, to: Date): Promise<ProfitAndLossStatement> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const [salesAgg, expensesAgg, purchasesAgg] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        where: { businessId, date: { gte: from, lte: to } },
        _sum: { totalInPaise: true },
      }),
      this.prisma.expense.aggregate({
        where: { businessId, date: { gte: from, lte: to } },
        _sum: { amountInPaise: true },
      }),
      this.prisma.purchase.aggregate({
        where: { businessId, date: { gte: from, lte: to } },
        _sum: { totalInPaise: true },
      }),
    ]);

    const revenueInPaise = salesAgg._sum.totalInPaise ?? 0;
    const costOfGoodsInPaise = purchasesAgg._sum.totalInPaise ?? 0;
    const operatingExpensesInPaise = expensesAgg._sum.amountInPaise ?? 0;
    const grossProfitInPaise = revenueInPaise - costOfGoodsInPaise;
    const netProfitInPaise = grossProfitInPaise - operatingExpensesInPaise;

    return {
      businessId,
      periodStart: from,
      periodEnd: to,
      revenueInPaise,
      costOfGoodsInPaise,
      grossProfitInPaise,
      operatingExpensesInPaise,
      netProfitInPaise,
      grossMarginBps: revenueInPaise === 0 ? 0 : Math.round((grossProfitInPaise * 10000) / revenueInPaise),
      netMarginBps: revenueInPaise === 0 ? 0 : Math.round((netProfitInPaise * 10000) / revenueInPaise),
    };
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private mapToJournalEntry(
    tx: {
      id: string; date: Date; type: TransactionType;
      amountInPaise: number; description: string | null;
      paymentMethod: PaymentMethod; referenceId: string | null;
    },
    customerName?: string | null,
    supplierName?: string | null,
  ): JournalEntry {
    const isDebit = tx.type === TransactionType.EXPENSE || tx.type === TransactionType.PURCHASE;
    return {
      id: tx.id,
      date: tx.date,
      type: tx.type,
      debitInPaise: isDebit ? tx.amountInPaise : 0,
      creditInPaise: isDebit ? 0 : tx.amountInPaise,
      description: tx.description,
      paymentMethod: tx.paymentMethod,
      referenceId: tx.referenceId,
      ...(customerName ? { partyName: customerName } : {}),
      ...(supplierName ? { partyName: supplierName } : {}),
    };
  }

  private accountForType(type: TransactionType): string {
    switch (type) {
      case TransactionType.SALE:           return 'Sales Revenue';
      case TransactionType.EXPENSE:        return 'Operating Expenses';
      case TransactionType.PURCHASE:       return 'Cost of Goods';
      case TransactionType.PAYMENT:        return 'Payments';
      case TransactionType.CREDIT_ISSUED:  return 'Receivables';
      case TransactionType.CREDIT_RECEIVED: return 'Payables';
      default:                             return 'Miscellaneous';
    }
  }
}
