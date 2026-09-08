// Unit tests for ExpensesService — validates business rules and paise arithmetic.
// PrismaService is mocked; no DB connection required.

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { ExpensesService } from '../expenses.service';

type MockPrisma = {
  business: { findUnique: jest.Mock };
  expense: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    aggregate: jest.Mock;
  };
  transaction: { create: jest.Mock };
  $transaction: jest.Mock;
};

function makeMockPrisma(): MockPrisma {
  const mock: MockPrisma = {
    business: { findUnique: jest.fn().mockResolvedValue({ id: 'biz1', name: 'Test Biz' }) },
    expense: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amountInPaise: null } }),
    },
    transaction: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  // Default: $transaction runs the array of queries and returns their results
  mock.$transaction.mockImplementation(async (ops: unknown) => {
    if (Array.isArray(ops)) return Promise.all(ops);
    if (typeof ops === 'function') return ops(mock);
    return ops;
  });

  const fakeExpense = {
    id: 'exp1',
    businessId: 'biz1',
    category: 'rent',
    amountInPaise: 50000,
    description: null,
    notes: null,
    paymentMethod: PaymentMethod.CASH,
    date: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
  };
  mock.expense.create.mockResolvedValue(fakeExpense);

  return mock;
}

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = makeMockPrisma();
    service = new ExpensesService(prisma as unknown as ConstructorParameters<typeof ExpensesService>[0]);
  });

  describe('createExpense', () => {
    it('rejects zero amount', async () => {
      await expect(
        service.createExpense({ businessId: 'biz1', category: 'rent', amountInPaise: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects negative amount', async () => {
      await expect(
        service.createExpense({ businessId: 'biz1', category: 'rent', amountInPaise: -100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid category', async () => {
      await expect(
        service.createExpense({
          businessId: 'biz1',
          category: 'vacation' as never,
          amountInPaise: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when business does not exist', async () => {
      prisma.business.findUnique.mockResolvedValue(null);
      await expect(
        service.createExpense({ businessId: 'missing', category: 'rent', amountInPaise: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates expense and ledger transaction atomically', async () => {
      await service.createExpense({
        businessId: 'biz1',
        category: 'salary',
        amountInPaise: 100000,
        paymentMethod: PaymentMethod.UPI,
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amountInPaise: 100000, category: 'salary' }),
        }),
      );
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ amountInPaise: 100000, type: 'EXPENSE' }),
        }),
      );
    });

    it('defaults paymentMethod to CASH when not provided', async () => {
      await service.createExpense({ businessId: 'biz1', category: 'rent', amountInPaise: 5000 });
      expect(prisma.expense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paymentMethod: PaymentMethod.CASH }),
        }),
      );
    });

    it('amounts are stored as integers (paise, not rupees)', async () => {
      await service.createExpense({ businessId: 'biz1', category: 'utilities', amountInPaise: 75050 });
      const call = prisma.expense.create.mock.calls[0][0];
      expect(Number.isInteger(call.data.amountInPaise)).toBe(true);
      expect(call.data.amountInPaise).toBe(75050);
    });
  });

  describe('getExpenseById', () => {
    it('returns expense when found', async () => {
      const fake = { id: 'exp1', businessId: 'biz1', category: 'rent', amountInPaise: 1000 };
      prisma.expense.findFirst.mockResolvedValue(fake);
      const result = await service.getExpenseById('biz1', 'exp1');
      expect(result).toBe(fake);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.expense.findFirst.mockResolvedValue(null);
      await expect(service.getExpenseById('biz1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getExpensesTodayTotal', () => {
    it('returns 0 when there are no expenses today', async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: null } });
      const total = await service.getExpensesTodayTotal('biz1');
      expect(total).toBe(0);
    });

    it('returns aggregated paise total', async () => {
      prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 250000 } });
      const total = await service.getExpensesTodayTotal('biz1');
      expect(total).toBe(250000);
      expect(Number.isInteger(total)).toBe(true);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('groups expenses by category and sums amounts', async () => {
      prisma.expense.findMany.mockResolvedValue([
        { category: 'rent', amountInPaise: 50000 },
        { category: 'rent', amountInPaise: 20000 },
        { category: 'salary', amountInPaise: 100000 },
      ]);

      const breakdown = await service.getCategoryBreakdown(
        'biz1',
        new Date('2026-01-01'),
        new Date('2026-02-01'),
      );

      expect(breakdown['rent']).toBe(70000);
      expect(breakdown['salary']).toBe(100000);
    });

    it('returns empty object when no expenses in range', async () => {
      prisma.expense.findMany.mockResolvedValue([]);
      const breakdown = await service.getCategoryBreakdown('biz1', new Date(), new Date());
      expect(Object.keys(breakdown)).toHaveLength(0);
    });
  });
});
