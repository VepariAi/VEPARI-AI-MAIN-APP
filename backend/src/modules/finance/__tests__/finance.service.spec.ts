// Unit tests for FinanceService — verifies paise arithmetic.
// PrismaService is mocked so no DB connection is required.

import { FinanceService } from '../finance.service';

type MockPrisma = {
  business: { findUnique: jest.Mock };
  saleOrder: { aggregate: jest.Mock };
  expense: { aggregate: jest.Mock };
};

function makeMockPrisma(): MockPrisma {
  return {
    business: { findUnique: jest.fn().mockResolvedValue({ id: 'biz1', name: 'Test' }) },
    saleOrder: { aggregate: jest.fn() },
    expense: { aggregate: jest.fn() },
  };
}

describe('FinanceService — paise arithmetic', () => {
  let service: FinanceService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = makeMockPrisma();
    service = new FinanceService(prisma as unknown as ConstructorParameters<typeof FinanceService>[0]);
  });

  it('calculates profit as sales minus expenses (paise integers)', async () => {
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 150000 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 50000 } });

    const result = await service.getProfitSummary('biz1', new Date(), new Date());
    expect(result.salesInPaise).toBe(150000);
    expect(result.expensesInPaise).toBe(50000);
    expect(result.profitInPaise).toBe(100000); // ₹1500 - ₹500 = ₹1000 (in paise)
  });

  it('returns negative profit when expenses exceed sales', async () => {
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 20000 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 30000 } });

    const result = await service.getProfitSummary('biz1', new Date(), new Date());
    expect(result.profitInPaise).toBe(-10000);
  });

  it('returns zero profit when there are no transactions', async () => {
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: null } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: null } });

    const result = await service.getProfitSummary('biz1', new Date(), new Date());
    expect(result.profitInPaise).toBe(0);
    expect(result.grossMarginBps).toBe(0);
  });

  it('computes grossMarginBps as integer (no float)', async () => {
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 100000 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 40000 } });

    const result = await service.getProfitSummary('biz1', new Date(), new Date());
    // profit = 60000 / 100000 * 10000 = 6000 bps (60%)
    expect(result.grossMarginBps).toBe(6000);
    expect(Number.isInteger(result.grossMarginBps)).toBe(true);
  });

  it('all result fields are integers (no floats)', async () => {
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 333333 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 111111 } });

    const result = await service.getProfitSummary('biz1', new Date(), new Date());
    expect(Number.isInteger(result.salesInPaise)).toBe(true);
    expect(Number.isInteger(result.expensesInPaise)).toBe(true);
    expect(Number.isInteger(result.profitInPaise)).toBe(true);
    expect(Number.isInteger(result.grossMarginBps)).toBe(true);
  });
});
