// Multi-device convergence test — PROMPT 159.
// Verifies that mutations from independent devices all converge on the server,
// that per-device re-delivery is idempotent (no double-apply), and that a pull
// after convergence reflects the merged state. PrismaService is fully mocked.

import { SyncService, SyncMutation } from '../sync.service';

const BIZ_ID = 'biz-converge';

function makePrisma() {
  const checkpointStore = new Map<string, { checkpoint: Record<string, unknown>; lastSyncAt: Date }>();
  const createdSales: Array<{ id: string }> = [];

  return {
    _createdSales: createdSales,
    syncCheckpoint: {
      findUnique: jest.fn(async ({ where }: { where: { businessId_deviceId: { businessId: string; deviceId: string } } }) => {
        const key = `${where.businessId_deviceId.businessId}:${where.businessId_deviceId.deviceId}`;
        return checkpointStore.get(key) ?? null;
      }),
      upsert: jest.fn(async ({ where, create, update }: {
        where: { businessId_deviceId: { businessId: string; deviceId: string } };
        create: { businessId: string; deviceId: string; lastSyncAt: Date; checkpoint: Record<string, unknown> };
        update: { lastSyncAt: Date; checkpoint: Record<string, unknown> };
      }) => {
        const key = `${where.businessId_deviceId.businessId}:${where.businessId_deviceId.deviceId}`;
        const existing = checkpointStore.get(key);
        const value = existing ? { ...existing, ...update } : { ...create };
        checkpointStore.set(key, value);
        return value;
      }),
    },
    saleOrder: {
      create: jest.fn(async () => {
        const sale = { id: `sale-${createdSales.length + 1}` };
        createdSales.push(sale);
        return sale;
      }),
      findMany: jest.fn(async () => createdSales.map((s, i) => ({
        id: s.id, totalInPaise: 1000, paymentMethod: 'CASH', date: new Date(),
        notes: null, status: 'COMPLETED', createdAt: new Date(Date.now() + i),
      }))),
    },
    transaction: { create: jest.fn().mockResolvedValue({ id: 'txn-1' }) },
    expense: { create: jest.fn().mockResolvedValue({ id: 'exp-1' }), findMany: jest.fn().mockResolvedValue([]) },
    customer: { findFirst: jest.fn().mockResolvedValue({ id: 'c1', creditBalance: 0 }), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    supplier: { findFirst: jest.fn().mockResolvedValue({ id: 's1', payableBalance: 0 }), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    product: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', stock: 100 }), update: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(async (ops: unknown[]) => { for (const op of ops) await op; return []; }),
  };
}

function saleMutation(id: string, totalInPaise = 1000): SyncMutation {
  return { id, type: 'CREATE_SALE', payload: { totalInPaise, paymentMethod: 'CASH' }, createdAt: Date.now() };
}

describe('SyncService — multi-device convergence (Prompt 159)', () => {
  it('applies mutations from two independent devices and converges', async () => {
    const prisma = makePrisma();
    const service = new SyncService(prisma as unknown as ConstructorParameters<typeof SyncService>[0]);

    const rA = await service.applyMutations(BIZ_ID, 'device-A', [saleMutation('A-1'), saleMutation('A-2')]);
    const rB = await service.applyMutations(BIZ_ID, 'device-B', [saleMutation('B-1')]);

    expect(rA.accepted).toEqual(['A-1', 'A-2']);
    expect(rB.accepted).toEqual(['B-1']);
    // Three distinct sales created — both devices' work converged on the server.
    expect(prisma._createdSales).toHaveLength(3);
  });

  it('is idempotent per device across reconnect re-delivery', async () => {
    const prisma = makePrisma();
    const service = new SyncService(prisma as unknown as ConstructorParameters<typeof SyncService>[0]);

    await service.applyMutations(BIZ_ID, 'device-A', [saleMutation('A-1')]);
    const afterFirst = prisma._createdSales.length;

    // Device A reconnects and replays the same batch plus a new mutation.
    const replay = await service.applyMutations(BIZ_ID, 'device-A', [saleMutation('A-1'), saleMutation('A-2')]);

    expect(replay.accepted).toEqual(['A-1', 'A-2']); // both acknowledged
    // Only the genuinely-new mutation created a sale; A-1 was not re-applied.
    expect(prisma._createdSales.length).toBe(afterFirst + 1);
  });

  it('a pull after convergence returns all devices merged changes', async () => {
    const prisma = makePrisma();
    const service = new SyncService(prisma as unknown as ConstructorParameters<typeof SyncService>[0]);

    await service.applyMutations(BIZ_ID, 'device-A', [saleMutation('A-1')]);
    await service.applyMutations(BIZ_ID, 'device-B', [saleMutation('B-1')]);

    const pull = await service.pullChanges(BIZ_ID, 0);
    const saleChanges = pull.changes.filter(c => c.entity === 'sale');
    expect(saleChanges.length).toBe(2); // both devices' sales visible to a puller
  });

  it('advances the server cursor monotonically across devices', async () => {
    const prisma = makePrisma();
    const service = new SyncService(prisma as unknown as ConstructorParameters<typeof SyncService>[0]);

    const rA = await service.applyMutations(BIZ_ID, 'device-A', [saleMutation('A-1')]);
    const rB = await service.applyMutations(BIZ_ID, 'device-B', [saleMutation('B-1')]);
    expect(rB.serverCursor).toBeGreaterThanOrEqual(rA.serverCursor);
  });
});
