// Unit tests for PaymentsService — validates payment recording, event emission,
// and credit/payable balance mutations.
// PrismaService and EventsService are mocked; no DB connection required.

import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from '../payments.service';

type MockPrisma = {
  business: { findUnique: jest.Mock };
  customer: { updateMany: jest.Mock };
  supplier: { updateMany: jest.Mock };
  transaction: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock };
};

type MockEvents = { emit: jest.Mock };

function makeFakeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn1',
    type: 'PAYMENT',
    amountInPaise: 25000,
    paymentMethod: 'CASH',
    customerId: null,
    customer: null,
    supplierId: null,
    supplier: null,
    description: null,
    notes: null,
    date: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeMockPrisma(): MockPrisma {
  return {
    business: { findUnique: jest.fn().mockResolvedValue({ id: 'biz1', name: 'Test Biz' }) },
    customer: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    supplier: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    transaction: {
      create: jest.fn().mockResolvedValue(makeFakeRow()),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
    },
  };
}

function makeMockEvents(): MockEvents {
  return { emit: jest.fn() };
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: MockPrisma;
  let events: MockEvents;

  beforeEach(() => {
    prisma = makeMockPrisma();
    events = makeMockEvents();
    service = new PaymentsService(
      prisma as unknown as ConstructorParameters<typeof PaymentsService>[0],
      events as unknown as ConstructorParameters<typeof PaymentsService>[1],
    );
  });

  describe('recordPayment', () => {
    it('throws NotFoundException when business does not exist', async () => {
      prisma.business.findUnique.mockResolvedValue(null);
      await expect(
        service.recordPayment('missing', { amountInPaise: 10000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a transaction row', async () => {
      await service.recordPayment('biz1', { amountInPaise: 25000 });
      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ businessId: 'biz1', amountInPaise: 25000 }),
        }),
      );
    });

    it('emits payment.recorded event after creating the transaction', async () => {
      await service.recordPayment('biz1', { amountInPaise: 50000 });
      expect(events.emit).toHaveBeenCalledWith(
        'payment.recorded',
        expect.objectContaining({ businessId: 'biz1', amountPaise: 50000 }),
      );
    });

    it('decrements customer creditBalance when customerId is provided', async () => {
      prisma.transaction.create.mockResolvedValue(
        makeFakeRow({ customerId: 'cust1', customer: { name: 'Alice' } }),
      );
      await service.recordPayment('biz1', { amountInPaise: 15000, customerId: 'cust1' });
      expect(prisma.customer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust1', businessId: 'biz1' },
          data: { creditBalance: { decrement: 15000 } },
        }),
      );
    });

    it('decrements supplier payableBalance when supplierId is provided', async () => {
      prisma.transaction.create.mockResolvedValue(
        makeFakeRow({ supplierId: 'sup1', supplier: { name: 'Supplier X' } }),
      );
      await service.recordPayment('biz1', { amountInPaise: 20000, supplierId: 'sup1' });
      expect(prisma.supplier.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sup1', businessId: 'biz1' },
          data: { payableBalance: { decrement: 20000 } },
        }),
      );
    });

    it('does not touch customer table when no customerId', async () => {
      await service.recordPayment('biz1', { amountInPaise: 10000 });
      expect(prisma.customer.updateMany).not.toHaveBeenCalled();
    });

    it('does not touch supplier table when no supplierId', async () => {
      await service.recordPayment('biz1', { amountInPaise: 10000 });
      expect(prisma.supplier.updateMany).not.toHaveBeenCalled();
    });

    it('emits direction OUT for supplier payment', async () => {
      prisma.transaction.create.mockResolvedValue(
        makeFakeRow({ supplierId: 'sup1', supplier: { name: 'Sup X' } }),
      );
      await service.recordPayment('biz1', { amountInPaise: 5000, supplierId: 'sup1' });
      expect(events.emit).toHaveBeenCalledWith(
        'payment.recorded',
        expect.objectContaining({ direction: 'OUT' }),
      );
    });

    it('emits direction IN when no supplierId', async () => {
      await service.recordPayment('biz1', { amountInPaise: 5000 });
      expect(events.emit).toHaveBeenCalledWith(
        'payment.recorded',
        expect.objectContaining({ direction: 'IN' }),
      );
    });

    it('defaults paymentMethod to CASH', async () => {
      await service.recordPayment('biz1', { amountInPaise: 3000 });
      const createCall = prisma.transaction.create.mock.calls[0][0];
      expect(createCall.data.paymentMethod).toBe('CASH');
    });

    it('amounts are passed as integers (paise)', async () => {
      await service.recordPayment('biz1', { amountInPaise: 123456 });
      const createCall = prisma.transaction.create.mock.calls[0][0];
      expect(Number.isInteger(createCall.data.amountInPaise)).toBe(true);
      expect(createCall.data.amountInPaise).toBe(123456);
    });
  });

  describe('getPaymentById', () => {
    it('returns mapped PaymentRow', async () => {
      prisma.transaction.findFirst.mockResolvedValue(
        makeFakeRow({ id: 'txn1', amountInPaise: 9999 }),
      );
      const result = await service.getPaymentById('biz1', 'txn1');
      expect(result.id).toBe('txn1');
      expect(result.amountInPaise).toBe(9999);
    });

    it('throws NotFoundException when payment not found', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);
      await expect(service.getPaymentById('biz1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listPayments', () => {
    it('returns empty array when no payments exist', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      const result = await service.listPayments('biz1');
      expect(result).toEqual([]);
    });

    it('maps rows including customerName and supplierName', async () => {
      prisma.transaction.findMany.mockResolvedValue([
        makeFakeRow({ customerId: 'c1', customer: { name: 'Alice' } }),
      ]);
      const result = await service.listPayments('biz1');
      expect(result[0]?.customerName).toBe('Alice');
    });
  });
});
