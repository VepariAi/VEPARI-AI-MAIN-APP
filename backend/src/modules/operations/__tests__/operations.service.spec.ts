// Unit tests for OperationsService (Prisma/MySQL-backed) — DL-011.
// PrismaService fully mocked.

import { OperationsService, CreateOperationDto } from '../operations.service';
import { NotFoundException } from '@nestjs/common';

const BIZ = 'biz-ops';

function makeRow(over: Record<string, unknown> = {}) {
  return {
    id: 'op-1',
    businessId: BIZ,
    type: 'TASK',
    title: 'Restock rice',
    description: null,
    status: 'OPEN',
    priority: 'NORMAL',
    customerId: null,
    assignedToUserId: null,
    dueDate: null,
    estimatedValueInPaise: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    completedAt: null,
    ...over,
  };
}

function makePrisma() {
  return {
    operation: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => makeRow(data)),
      update: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => makeRow({ ...data })),
    },
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new OperationsService(prisma as unknown as ConstructorParameters<typeof OperationsService>[0]);
}

describe('OperationsService.create', () => {
  it('creates an operation with defaults (OPEN, NORMAL)', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    const dto: CreateOperationDto = { type: 'REPAIR', title: 'Fix weighing scale' };
    await svc.create(BIZ, dto);
    const arg = (prisma.operation.create as jest.Mock).mock.calls[0][0];
    expect(arg.data.status).toBe('OPEN');
    expect(arg.data.priority).toBe('NORMAL');
    expect(arg.data.businessId).toBe(BIZ);
  });

  it('parses dueDate ISO string to a Date', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    await svc.create(BIZ, { type: 'DELIVERY', title: 'Deliver order', dueDate: '2026-03-01T10:00:00Z' });
    const arg = (prisma.operation.create as jest.Mock).mock.calls[0][0];
    expect(arg.data.dueDate).toBeInstanceOf(Date);
  });
});

describe('OperationsService.getById', () => {
  it('is scoped by id + businessId', async () => {
    const prisma = makePrisma();
    (prisma.operation.findFirst as jest.Mock).mockResolvedValue(makeRow());
    const svc = makeService(prisma);
    await svc.getById(BIZ, 'op-1');
    expect((prisma.operation.findFirst as jest.Mock).mock.calls[0][0].where).toEqual({ id: 'op-1', businessId: BIZ });
  });

  it('throws NotFound when missing', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.getById(BIZ, 'nope')).rejects.toThrow(NotFoundException);
  });
});

describe('OperationsService.updateStatus', () => {
  it('sets completedAt when completed', async () => {
    const prisma = makePrisma();
    (prisma.operation.findFirst as jest.Mock).mockResolvedValue(makeRow({ status: 'IN_PROGRESS' }));
    const svc = makeService(prisma);
    await svc.updateStatus(BIZ, 'op-1', 'COMPLETED');
    const arg = (prisma.operation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data.status).toBe('COMPLETED');
    expect(arg.data.completedAt).toBeInstanceOf(Date);
  });

  it('does not set completedAt for non-completed transitions', async () => {
    const prisma = makePrisma();
    (prisma.operation.findFirst as jest.Mock).mockResolvedValue(makeRow());
    const svc = makeService(prisma);
    await svc.updateStatus(BIZ, 'op-1', 'IN_PROGRESS');
    const arg = (prisma.operation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data).not.toHaveProperty('completedAt');
  });
});

describe('OperationsService.update', () => {
  it('only sends provided fields (partial update)', async () => {
    const prisma = makePrisma();
    (prisma.operation.findFirst as jest.Mock).mockResolvedValue(makeRow());
    const svc = makeService(prisma);
    await svc.update(BIZ, 'op-1', { title: 'New title' });
    const arg = (prisma.operation.update as jest.Mock).mock.calls[0][0];
    expect(arg.data).toEqual({ title: 'New title' });
  });

  it('throws NotFound when updating a missing operation', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.update(BIZ, 'nope', { title: 'x' })).rejects.toThrow(NotFoundException);
  });
});
