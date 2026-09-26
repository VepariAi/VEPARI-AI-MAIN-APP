// Unit tests for ReturnsService (Prisma/MySQL-backed) — DL-011.
// PrismaService fully mocked. All monetary values are integer paise.

import { ReturnsService, CreateReturnDto } from '../returns.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const BIZ = 'biz-returns';

function makeRow(over: Record<string, unknown> = {}) {
  return {
    id: 'ret-1',
    businessId: BIZ,
    type: 'SALE_RETURN',
    status: 'PENDING',
    referenceId: 'so-1',
    customerId: 'cust-1',
    supplierId: null,
    items: [{ productId: 'p1', quantity: 2, priceInPaise: 5000, reason: 'DEFECTIVE' }],
    totalRefundInPaise: 10000,
    notes: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    resolvedAt: null,
    ...over,
  };
}

function makePrisma() {
  return {
    return: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => makeRow(data)),
      update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => makeRow({ ...data })),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalRefundInPaise: null } }),
    },
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new ReturnsService(prisma as unknown as ConstructorParameters<typeof ReturnsService>[0]);
}

describe('ReturnsService.create', () => {
  it('creates a SALE_RETURN with computed refund total', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    const dto: CreateReturnDto = {
      type: 'SALE_RETURN',
      referenceId: 'so-1',
      customerId: 'cust-1',
      items: [
        { productId: 'p1', quantity: 2, priceInPaise: 5000, reason: 'DEFECTIVE' },
        { productId: 'p2', quantity: 1, priceInPaise: 3000, reason: 'WRONG_ITEM' },
      ],
    };
    const ret = await svc.create(BIZ, dto);
    const createArg = (prisma.return.create as jest.Mock).mock.calls[0][0];
    expect(createArg.data.totalRefundInPaise).toBe(13000); // 2*5000 + 1*3000
    expect(createArg.data.status).toBe('PENDING');
    expect(Number.isInteger(ret.totalRefundInPaise)).toBe(true);
  });

  it('rejects an empty item list', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.create(BIZ, { type: 'SALE_RETURN', referenceId: 'so-1', customerId: 'c', items: [] }))
      .rejects.toThrow(BadRequestException);
  });

  it('requires customerId for SALE_RETURN', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.create(BIZ, {
      type: 'SALE_RETURN', referenceId: 'so-1',
      items: [{ productId: 'p', quantity: 1, priceInPaise: 100, reason: 'OTHER' }],
    })).rejects.toThrow(/customerId/);
  });

  it('requires supplierId for PURCHASE_RETURN', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.create(BIZ, {
      type: 'PURCHASE_RETURN', referenceId: 'po-1',
      items: [{ productId: 'p', quantity: 1, priceInPaise: 100, reason: 'OTHER' }],
    })).rejects.toThrow(/supplierId/);
  });
});

describe('ReturnsService.getById', () => {
  it('returns a scoped record', async () => {
    const prisma = makePrisma();
    (prisma.return.findFirst as jest.Mock).mockResolvedValue(makeRow());
    const svc = makeService(prisma);
    const ret = await svc.getById(BIZ, 'ret-1');
    expect(ret.id).toBe('ret-1');
    // Query is scoped by both id and businessId (tenant isolation).
    expect((prisma.return.findFirst as jest.Mock).mock.calls[0][0].where).toEqual({ id: 'ret-1', businessId: BIZ });
  });

  it('throws NotFound when missing', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.getById(BIZ, 'nope')).rejects.toThrow(NotFoundException);
  });
});

describe('ReturnsService.updateStatus', () => {
  it('sets resolvedAt when refunded', async () => {
    const prisma = makePrisma();
    (prisma.return.findFirst as jest.Mock).mockResolvedValue(makeRow({ status: 'APPROVED' }));
    const svc = makeService(prisma);
    await svc.updateStatus(BIZ, 'ret-1', 'REFUNDED');
    const updateArg = (prisma.return.update as jest.Mock).mock.calls[0][0];
    expect(updateArg.data.status).toBe('REFUNDED');
    expect(updateArg.data.resolvedAt).toBeInstanceOf(Date);
  });

  it('refuses to change a completed refund', async () => {
    const prisma = makePrisma();
    (prisma.return.findFirst as jest.Mock).mockResolvedValue(makeRow({ status: 'REFUNDED' }));
    const svc = makeService(prisma);
    await expect(svc.updateStatus(BIZ, 'ret-1', 'APPROVED')).rejects.toThrow(BadRequestException);
  });
});

describe('ReturnsService.getSummary', () => {
  it('aggregates counts and total refunded (integer paise)', async () => {
    const prisma = makePrisma();
    (prisma.return.count as jest.Mock)
      .mockResolvedValueOnce(3)  // pending
      .mockResolvedValueOnce(2)  // approved
      .mockResolvedValueOnce(5); // refunded
    (prisma.return.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalRefundInPaise: 45000 } });
    const svc = makeService(prisma);
    const summary = await svc.getSummary(BIZ);
    expect(summary).toEqual({ pendingCount: 3, approvedCount: 2, refundedCount: 5, totalRefundedInPaise: 45000 });
  });

  it('handles no refunds (null aggregate → 0)', async () => {
    const svc = makeService(makePrisma());
    const summary = await svc.getSummary(BIZ);
    expect(summary.totalRefundedInPaise).toBe(0);
  });
});
