// Unit tests for JournalService — Prompt 127.
// PrismaService is fully mocked — no DB connection required.
// All monetary values are in paise (integer), never float.

import { JournalService } from '../journal.service';
import { NotFoundException } from '@nestjs/common';

const BIZ_ID = 'biz-journal-test';

// ── Prisma mock factories ─────────────────────────────────────────────────────

function makeTx(overrides: Partial<{
  id: string; date: Date; type: string; amountInPaise: number;
  description: string | null; paymentMethod: string; referenceId: string | null;
  customer: { name: string } | null; supplier: { name: string } | null;
}> = {}) {
  return {
    id: 'txn-1',
    date: new Date('2026-01-15'),
    type: 'SALE',
    amountInPaise: 10000,
    description: 'Test sale',
    paymentMethod: 'CASH',
    referenceId: null,
    customer: null,
    supplier: null,
    ...overrides,
  };
}

function makePrisma() {
  return {
    business: {
      findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }),
    },
    transaction: {
      create: jest.fn().mockResolvedValue(makeTx()),
      findMany: jest.fn().mockResolvedValue([]),
    },
    saleOrder: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalInPaise: null } }),
    },
    expense: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amountInPaise: null } }),
    },
    purchase: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalInPaise: null } }),
    },
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new JournalService(prisma as unknown as ConstructorParameters<typeof JournalService>[0]);
}

// ── recordEntry ───────────────────────────────────────────────────────────────

describe('JournalService.recordEntry', () => {
  it('creates a SALE journal entry with credit side', async () => {
    const prisma = makePrisma();
    (prisma.transaction.create as jest.Mock).mockResolvedValue(makeTx({ amountInPaise: 50000 }));
    const service = makeService(prisma);

    const entry = await service.recordEntry(BIZ_ID, {
      type: 'SALE' as any,
      amountInPaise: 50000,
      description: 'Rice sack sold',
    });

    expect(entry.creditInPaise).toBe(50000);
    expect(entry.debitInPaise).toBe(0);
  });

  it('creates an EXPENSE journal entry with debit side', async () => {
    const prisma = makePrisma();
    (prisma.transaction.create as jest.Mock).mockResolvedValue(
      makeTx({ type: 'EXPENSE', amountInPaise: 2000 }),
    );
    const service = makeService(prisma);

    const entry = await service.recordEntry(BIZ_ID, {
      type: 'EXPENSE' as any,
      amountInPaise: 2000,
    });

    expect(entry.debitInPaise).toBe(2000);
    expect(entry.creditInPaise).toBe(0);
  });

  it('creates a PURCHASE journal entry with debit side', async () => {
    const prisma = makePrisma();
    (prisma.transaction.create as jest.Mock).mockResolvedValue(
      makeTx({ type: 'PURCHASE', amountInPaise: 35000 }),
    );
    const service = makeService(prisma);

    const entry = await service.recordEntry(BIZ_ID, {
      type: 'PURCHASE' as any,
      amountInPaise: 35000,
    });

    expect(entry.debitInPaise).toBe(35000);
    expect(entry.creditInPaise).toBe(0);
  });

  it('amounts are always integers (paise)', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const entry = await service.recordEntry(BIZ_ID, { type: 'SALE' as any, amountInPaise: 12345 });
    expect(Number.isInteger(entry.debitInPaise)).toBe(true);
    expect(Number.isInteger(entry.creditInPaise)).toBe(true);
  });
});

// ── getJournalEntries ─────────────────────────────────────────────────────────

describe('JournalService.getJournalEntries', () => {
  it('returns empty array when no transactions in period', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const entries = await service.getJournalEntries(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));
    expect(entries).toHaveLength(0);
  });

  it('maps customer name to partyName on sale transactions', async () => {
    const prisma = makePrisma();
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
      makeTx({ customer: { name: 'Ramesh Kumar' } }),
    ]);
    const service = makeService(prisma);
    const entries = await service.getJournalEntries(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));
    expect(entries[0]!.partyName).toBe('Ramesh Kumar');
  });

  it('maps supplier name to partyName on purchase transactions', async () => {
    const prisma = makePrisma();
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
      makeTx({ type: 'PURCHASE', amountInPaise: 30000, supplier: { name: 'Global Traders' } }),
    ]);
    const service = makeService(prisma);
    const entries = await service.getJournalEntries(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));
    expect(entries[0]!.partyName).toBe('Global Traders');
  });
});

// ── getLedger ─────────────────────────────────────────────────────────────────

describe('JournalService.getLedger', () => {
  it('groups entries by account type', async () => {
    const prisma = makePrisma();
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
      makeTx({ id: '1', type: 'SALE', amountInPaise: 10000 }),
      makeTx({ id: '2', type: 'EXPENSE', amountInPaise: 3000 }),
      makeTx({ id: '3', type: 'SALE', amountInPaise: 5000 }),
    ]);
    const service = makeService(prisma);
    const ledger = await service.getLedger(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));

    const salesAccount = ledger.find(a => a.accountName === 'Sales Revenue');
    expect(salesAccount).toBeDefined();
    expect(salesAccount!.entries).toHaveLength(2);
    // Sales are credits
    expect(salesAccount!.balanceInPaise).toBe(15000);

    const expenseAccount = ledger.find(a => a.accountName === 'Operating Expenses');
    expect(expenseAccount).toBeDefined();
    // Expenses are debits → negative balance
    expect(expenseAccount!.balanceInPaise).toBe(-3000);
  });
});

// ── getTrialBalance ───────────────────────────────────────────────────────────

describe('JournalService.getTrialBalance', () => {
  it('returns balanced total debits and credits from mixed entries', async () => {
    const prisma = makePrisma();
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
      makeTx({ id: '1', type: 'SALE', amountInPaise: 20000 }),
      makeTx({ id: '2', type: 'EXPENSE', amountInPaise: 5000 }),
      makeTx({ id: '3', type: 'PURCHASE', amountInPaise: 8000 }),
    ]);
    const service = makeService(prisma);
    const tb = await service.getTrialBalance(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));

    expect(tb.debitTotalInPaise).toBe(13000);   // EXPENSE + PURCHASE
    expect(tb.creditTotalInPaise).toBe(20000);   // SALE
    expect(tb.accounts.length).toBeGreaterThan(0);
  });

  it('all account amounts are integers', async () => {
    const prisma = makePrisma();
    (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
      makeTx({ type: 'SALE', amountInPaise: 100001 }),
    ]);
    const service = makeService(prisma);
    const tb = await service.getTrialBalance(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));

    for (const acc of tb.accounts) {
      expect(Number.isInteger(acc.debitTotalInPaise)).toBe(true);
      expect(Number.isInteger(acc.creditTotalInPaise)).toBe(true);
      expect(Number.isInteger(acc.netInPaise)).toBe(true);
    }
  });
});

// ── getProfitAndLoss ──────────────────────────────────────────────────────────

describe('JournalService.getProfitAndLoss', () => {
  it('throws NotFoundException for unknown business', async () => {
    const prisma = makePrisma();
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const service = makeService(prisma);
    await expect(
      service.getProfitAndLoss('no-biz', new Date('2026-01-01'), new Date('2026-01-31')),
    ).rejects.toThrow(NotFoundException);
  });

  it('computes gross profit = revenue - cost of goods', async () => {
    const prisma = makePrisma();
    (prisma.saleOrder.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalInPaise: 500000 } });
    (prisma.purchase.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalInPaise: 200000 } });
    (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountInPaise: 50000 } });
    const service = makeService(prisma);

    const pl = await service.getProfitAndLoss(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));

    expect(pl.revenueInPaise).toBe(500000);
    expect(pl.costOfGoodsInPaise).toBe(200000);
    expect(pl.grossProfitInPaise).toBe(300000);   // 500000 - 200000
    expect(pl.operatingExpensesInPaise).toBe(50000);
    expect(pl.netProfitInPaise).toBe(250000);      // 300000 - 50000
  });

  it('computes gross margin in basis points', async () => {
    const prisma = makePrisma();
    (prisma.saleOrder.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalInPaise: 100000 } });
    (prisma.purchase.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalInPaise: 40000 } });
    (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountInPaise: 0 } });
    const service = makeService(prisma);

    const pl = await service.getProfitAndLoss(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));

    // grossProfit = 60000, revenue = 100000 → 60% → 6000 bps
    expect(pl.grossMarginBps).toBe(6000);
    expect(Number.isInteger(pl.grossMarginBps)).toBe(true);
    expect(Number.isInteger(pl.netMarginBps)).toBe(true);
  });

  it('returns zero margins when revenue is zero', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const pl = await service.getProfitAndLoss(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));

    expect(pl.grossMarginBps).toBe(0);
    expect(pl.netMarginBps).toBe(0);
  });

  it('handles null aggregates gracefully (no sales/purchases)', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const pl = await service.getProfitAndLoss(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));

    expect(pl.revenueInPaise).toBe(0);
    expect(pl.netProfitInPaise).toBe(0);
  });

  it('all P&L values are integers', async () => {
    const prisma = makePrisma();
    (prisma.saleOrder.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalInPaise: 375000 } });
    (prisma.purchase.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalInPaise: 123456 } });
    (prisma.expense.aggregate as jest.Mock).mockResolvedValue({ _sum: { amountInPaise: 77777 } });
    const service = makeService(prisma);

    const pl = await service.getProfitAndLoss(BIZ_ID, new Date('2026-01-01'), new Date('2026-01-31'));
    expect(Number.isInteger(pl.revenueInPaise)).toBe(true);
    expect(Number.isInteger(pl.grossProfitInPaise)).toBe(true);
    expect(Number.isInteger(pl.netProfitInPaise)).toBe(true);
    expect(Number.isInteger(pl.grossMarginBps)).toBe(true);
    expect(Number.isInteger(pl.netMarginBps)).toBe(true);
  });
});
