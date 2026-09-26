// Unit tests for FinanceService — cash flow, receivables & payables.
// Verifies PRD §22 definitions: only non-credit payment methods contribute
// to cash flow; receivables are customer credit balances > 0; payables are
// supplier payable balances > 0. All amounts remain integer paise.

import { FinanceService } from '../finance.service';

const BIZ_ID = 'biz-1';

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    business: { findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }) },
    saleOrder: { aggregate: jest.fn() },
    expense: { aggregate: jest.fn() },
    customer: { findMany: jest.fn() },
    supplier: { findMany: jest.fn() },
    bankStatementImport: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    bankStatementEntry: { createMany: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    transaction: { findMany: jest.fn() },
    $transaction: jest.fn(),
    ...overrides,
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new FinanceService(prisma as unknown as ConstructorParameters<typeof FinanceService>[0]);
}

// ── Cash flow ──────────────────────────────────────────────────────────────────

describe('FinanceService — getCashFlowSummary', () => {
  it('computes net cash flow = inflow - outflow (integer paise)', async () => {
    const prisma = makePrisma();
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 200000 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 80000 } });

    const service = makeService(prisma);
    const result = await service.getCashFlowSummary(BIZ_ID, new Date(), new Date());

    expect(result.cashInflowInPaise).toBe(200000);
    expect(result.cashOutflowInPaise).toBe(80000);
    expect(result.netCashFlowInPaise).toBe(120000);
    expect(Number.isInteger(result.netCashFlowInPaise)).toBe(true);
  });

  it('returns 0 for all figures when there are no transactions', async () => {
    const prisma = makePrisma();
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: null } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: null } });

    const service = makeService(prisma);
    const result = await service.getCashFlowSummary(BIZ_ID, new Date(), new Date());

    expect(result.cashInflowInPaise).toBe(0);
    expect(result.cashOutflowInPaise).toBe(0);
    expect(result.netCashFlowInPaise).toBe(0);
  });

  it('filters saleOrder query to non-credit payment methods', async () => {
    const prisma = makePrisma();
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 0 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 0 } });

    const service = makeService(prisma);
    await service.getCashFlowSummary(BIZ_ID, new Date('2024-01-01'), new Date('2024-01-31'));

    const callArgs = (prisma.saleOrder.aggregate as jest.Mock).mock.calls[0][0] as { where: { paymentMethod?: { in: string[] } } };
    // CREDIT must NOT be in the paymentMethod filter — only cash-equivalent methods
    expect(callArgs.where.paymentMethod?.in).toBeDefined();
    expect(callArgs.where.paymentMethod?.in).not.toContain('CREDIT');
    expect(callArgs.where.paymentMethod?.in).toContain('CASH');
    expect(callArgs.where.paymentMethod?.in).toContain('UPI');
  });

  it('returns negative net cash flow when outflow exceeds inflow', async () => {
    const prisma = makePrisma();
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 10000 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 30000 } });

    const service = makeService(prisma);
    const result = await service.getCashFlowSummary(BIZ_ID, new Date(), new Date());

    expect(result.netCashFlowInPaise).toBe(-20000);
  });
});

// ── Receivables & Payables ─────────────────────────────────────────────────────

describe('FinanceService — getReceivablesPayables', () => {
  it('sums customer credit balances > 0 as receivables', async () => {
    const prisma = makePrisma();
    prisma.customer.findMany.mockResolvedValue([
      { creditBalance: 50000 },
      { creditBalance: 25000 },
    ]);
    prisma.supplier.findMany.mockResolvedValue([]);

    const service = makeService(prisma);
    const result = await service.getReceivablesPayables(BIZ_ID);

    expect(result.totalReceivablesInPaise).toBe(75000);
    expect(result.customersWithBalance).toBe(2);
    expect(Number.isInteger(result.totalReceivablesInPaise)).toBe(true);
  });

  it('sums supplier payable balances > 0 as payables', async () => {
    const prisma = makePrisma();
    prisma.customer.findMany.mockResolvedValue([]);
    prisma.supplier.findMany.mockResolvedValue([
      { payableBalance: 100000 },
      { payableBalance: 40000 },
    ]);

    const service = makeService(prisma);
    const result = await service.getReceivablesPayables(BIZ_ID);

    expect(result.totalPayablesInPaise).toBe(140000);
    expect(result.suppliersWithBalance).toBe(2);
  });

  it('returns zeros when no customers or suppliers have balances', async () => {
    const prisma = makePrisma();
    prisma.customer.findMany.mockResolvedValue([]);
    prisma.supplier.findMany.mockResolvedValue([]);

    const service = makeService(prisma);
    const result = await service.getReceivablesPayables(BIZ_ID);

    expect(result.totalReceivablesInPaise).toBe(0);
    expect(result.totalPayablesInPaise).toBe(0);
    expect(result.customersWithBalance).toBe(0);
    expect(result.suppliersWithBalance).toBe(0);
  });

  it('only queries customers/suppliers with creditBalance > 0 (already filtered by Prisma)', async () => {
    const prisma = makePrisma();
    prisma.customer.findMany.mockResolvedValue([]);
    prisma.supplier.findMany.mockResolvedValue([]);

    const service = makeService(prisma);
    await service.getReceivablesPayables(BIZ_ID);

    const custArgs = (prisma.customer.findMany as jest.Mock).mock.calls[0][0] as { where: { creditBalance?: { gt: number } } };
    expect(custArgs.where.creditBalance).toEqual({ gt: 0 });

    const supArgs = (prisma.supplier.findMany as jest.Mock).mock.calls[0][0] as { where: { payableBalance?: { gt: number } } };
    expect(supArgs.where.payableBalance).toEqual({ gt: 0 });
  });
});
