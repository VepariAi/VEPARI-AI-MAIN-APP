// Unit tests for PurchasesService — validates purchase creation, stock updates,
// credit payable logic, and paise integer arithmetic.
// PrismaService is mocked; no DB connection required.

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PurchasesService } from '../purchases.service';

type TxClient = {
  purchase: { create: jest.Mock };
  product: { update: jest.Mock };
  supplier: { update: jest.Mock };
  transaction: { create: jest.Mock };
};

type MockPrisma = {
  business: { findUnique: jest.Mock };
  supplier: { findFirst: jest.Mock };
  purchase: { findFirst: jest.Mock; findMany: jest.Mock };
  $transaction: jest.Mock;
};

function makeDefaultPurchase() {
  return {
    id: 'pur1',
    businessId: 'biz1',
    supplierId: null,
    totalInPaise: 30000,
    taxInPaise: 0,
    paymentMethod: PaymentMethod.CASH,
    status: 'completed',
    notes: null,
    date: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    items: [{ id: 'pi1', productId: 'prod1', quantity: 3, unitCostInPaise: 10000, totalInPaise: 30000 }],
  };
}

function makeMockPrisma(): MockPrisma {
  const txClient: TxClient = {
    purchase: { create: jest.fn().mockResolvedValue(makeDefaultPurchase()) },
    product: { update: jest.fn().mockResolvedValue({}) },
    supplier: { update: jest.fn().mockResolvedValue({}) },
    transaction: { create: jest.fn().mockResolvedValue({}) },
  };

  const mock: MockPrisma = {
    business: { findUnique: jest.fn().mockResolvedValue({ id: 'biz1', name: 'Test Biz' }) },
    supplier: { findFirst: jest.fn().mockResolvedValue({ id: 'sup1', name: 'Supplier A', businessId: 'biz1' }) },
    purchase: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn().mockImplementation(async (fn: (tx: TxClient) => Promise<unknown>) => fn(txClient)),
  };

  // Expose txClient so tests can inspect it
  (mock as unknown as { _tx: TxClient })._tx = txClient;

  return mock;
}

describe('PurchasesService', () => {
  let service: PurchasesService;
  let prisma: MockPrisma;

  function tx() {
    return (prisma as unknown as { _tx: TxClient })._tx;
  }

  beforeEach(() => {
    prisma = makeMockPrisma();
    service = new PurchasesService(prisma as unknown as ConstructorParameters<typeof PurchasesService>[0]);
  });

  describe('createPurchase', () => {
    const baseDto = {
      businessId: 'biz1',
      items: [{ productId: 'prod1', quantity: 3, unitCostInPaise: 10000 }],
    };

    it('throws NotFoundException when business does not exist', async () => {
      prisma.business.findUnique.mockResolvedValue(null);
      await expect(service.createPurchase(baseDto)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when supplier is not found for this business', async () => {
      prisma.supplier.findFirst.mockResolvedValue(null);
      await expect(service.createPurchase({ ...baseDto, supplierId: 'bad-sup' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when item quantity is zero', async () => {
      await expect(
        service.createPurchase({ ...baseDto, items: [{ productId: 'p1', quantity: 0, unitCostInPaise: 5000 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when unit cost is negative', async () => {
      await expect(
        service.createPurchase({ ...baseDto, items: [{ productId: 'p1', quantity: 1, unitCostInPaise: -100 }] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes line total as quantity × unitCostInPaise (integer)', async () => {
      // 3 items × ₹100.00 = ₹300.00 = 30000 paise
      await service.createPurchase(baseDto);
      const createCall = tx().purchase.create.mock.calls[0][0];
      const item = createCall.data.items.create[0];
      expect(item.totalInPaise).toBe(30000);
      expect(Number.isInteger(item.totalInPaise)).toBe(true);
    });

    it('uses Math.round for fractional paise totals', async () => {
      // 3 × 333 = 999 paise (exact integer, no float)
      await service.createPurchase({
        businessId: 'biz1',
        items: [{ productId: 'p1', quantity: 3, unitCostInPaise: 333 }],
      });
      const createCall = tx().purchase.create.mock.calls[0][0];
      expect(createCall.data.items.create[0].totalInPaise).toBe(999);
    });

    it('respects caller-provided totalInPaise override', async () => {
      await service.createPurchase({ ...baseDto, totalInPaise: 99999 });
      const createCall = tx().purchase.create.mock.calls[0][0];
      expect(createCall.data.totalInPaise).toBe(99999);
    });

    it('increments product stock inside the transaction', async () => {
      await service.createPurchase(baseDto);
      expect(tx().product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod1' },
          data: { stock: { increment: 3 } },
        }),
      );
    });

    it('increments supplier payableBalance when payment method is CREDIT', async () => {
      await service.createPurchase({
        businessId: 'biz1',
        supplierId: 'sup1',
        items: [{ productId: 'prod1', quantity: 1, unitCostInPaise: 50000 }],
        paymentMethod: PaymentMethod.CREDIT,
      });
      expect(tx().supplier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sup1' },
          data: { payableBalance: { increment: expect.any(Number) } },
        }),
      );
    });

    it('does NOT update supplier payableBalance for CASH payment', async () => {
      await service.createPurchase({
        businessId: 'biz1',
        supplierId: 'sup1',
        items: [{ productId: 'prod1', quantity: 1, unitCostInPaise: 50000 }],
        paymentMethod: PaymentMethod.CASH,
      });
      expect(tx().supplier.update).not.toHaveBeenCalled();
    });

    it('creates a ledger transaction entry', async () => {
      await service.createPurchase(baseDto);
      expect(tx().transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'PURCHASE', businessId: 'biz1' }),
        }),
      );
    });

    it('returns summary with all integer paise fields', async () => {
      const result = await service.createPurchase(baseDto);
      expect(Number.isInteger(result.totalInPaise)).toBe(true);
    });
  });
});
