// Unit tests for SyncService — Prompts 150-157 (offline mutation push + idempotency + pull).
// PrismaService is fully mocked — no DB connection required.

import { SyncService, SyncMutation } from '../sync.service';

const BIZ_ID = 'biz-sync-test';

function makePrisma() {
  const checkpointStore = new Map<string, { checkpoint: Record<string, unknown>; lastSyncAt: Date }>();

  return {
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
      create: jest.fn().mockResolvedValue({ id: 'sale-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    transaction: {
      create: jest.fn().mockResolvedValue({ id: 'txn-1' }),
    },
    expense: {
      create: jest.fn().mockResolvedValue({ id: 'exp-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    customer: {
      findFirst: jest.fn().mockResolvedValue({ id: 'cust-1', creditBalance: 0 }),
      update: jest.fn().mockResolvedValue({ id: 'cust-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    supplier: {
      findFirst: jest.fn().mockResolvedValue({ id: 'supp-1', payableBalance: 0 }),
      update: jest.fn().mockResolvedValue({ id: 'supp-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    product: {
      findFirst: jest.fn().mockResolvedValue({ id: 'prod-1', stock: 100 }),
      update: jest.fn().mockResolvedValue({ id: 'prod-1' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(async (ops: unknown[]) => {
      for (const op of ops) await op;
      return [];
    }),
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new SyncService(prisma as unknown as ConstructorParameters<typeof SyncService>[0]);
}

// ── Push (applyMutations) ──────────────────────────────────────────────────────

describe('SyncService.applyMutations', () => {
  it('accepts a valid CREATE_SALE mutation', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const mutation: SyncMutation = {
      id: 'mut-001',
      type: 'CREATE_SALE',
      payload: { totalInPaise: 5000, paymentMethod: 'CASH' },
      createdAt: Date.now(),
    };

    const result = await service.applyMutations(BIZ_ID, 'device-1', [mutation]);
    expect(result.accepted).toContain('mut-001');
    expect(result.rejected).toHaveLength(0);
    expect(result.serverCursor).toBeGreaterThan(0);
  });

  it('rejects CREATE_SALE with invalid total', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const mutation: SyncMutation = {
      id: 'mut-002',
      type: 'CREATE_SALE',
      payload: { totalInPaise: 0 },
      createdAt: Date.now(),
    };

    const result = await service.applyMutations(BIZ_ID, 'device-1', [mutation]);
    expect(result.rejected[0]!.id).toBe('mut-002');
    expect(result.rejected[0]!.reason).toContain('Invalid sale total');
  });

  it('idempotently accepts already-applied mutations', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const mutation: SyncMutation = {
      id: 'mut-idem-1',
      type: 'CREATE_SALE',
      payload: { totalInPaise: 3000, paymentMethod: 'CASH' },
      createdAt: Date.now(),
    };

    // First push
    const r1 = await service.applyMutations(BIZ_ID, 'device-2', [mutation]);
    expect(r1.accepted).toContain('mut-idem-1');
    const createCallsBefore = (prisma.saleOrder.create as jest.Mock).mock.calls.length;

    // Duplicate push — same mutation ID, same device
    const r2 = await service.applyMutations(BIZ_ID, 'device-2', [mutation]);
    expect(r2.accepted).toContain('mut-idem-1');
    expect(r2.rejected).toHaveLength(0);
    // The DB create should NOT have been called again
    const createCallsAfter = (prisma.saleOrder.create as jest.Mock).mock.calls.length;
    expect(createCallsAfter).toBe(createCallsBefore);
  });

  it('rejects batch over 100 mutations', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const mutations: SyncMutation[] = Array.from({ length: 101 }, (_, i) => ({
      id: `mut-${i}`,
      type: 'CREATE_SALE' as const,
      payload: { totalInPaise: 1000 },
      createdAt: Date.now(),
    }));

    await expect(service.applyMutations(BIZ_ID, 'device-1', mutations)).rejects.toThrow(/Max 100/);
  });

  it('accepts CREATE_EXPENSE mutation', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const mutation: SyncMutation = {
      id: 'mut-exp-1',
      type: 'CREATE_EXPENSE',
      payload: { amountInPaise: 2000, category: 'transport', paymentMethod: 'UPI' },
      createdAt: Date.now(),
    };
    const result = await service.applyMutations(BIZ_ID, 'device-1', [mutation]);
    expect(result.accepted).toContain('mut-exp-1');
  });

  it('accepts ADJUST_STOCK and rejects negative stock', async () => {
    const prisma = makePrisma();
    // stock = 100, adjustment = -200 → should reject
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ id: 'prod-1', stock: 5 });
    const service = makeService(prisma);
    const mutation: SyncMutation = {
      id: 'mut-stock-1',
      type: 'ADJUST_STOCK',
      payload: { productId: 'prod-1', adjustment: -200 },
      createdAt: Date.now(),
    };
    const result = await service.applyMutations(BIZ_ID, 'device-1', [mutation]);
    expect(result.rejected[0]!.reason).toContain('below zero');
  });
});

// ── Pull ──────────────────────────────────────────────────────────────────────

describe('SyncService.pullChanges', () => {
  it('returns empty changes when no data since cursor', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const result = await service.pullChanges(BIZ_ID, Date.now());
    expect(result.changes).toHaveLength(0);
    expect(result.cursor).toBeGreaterThan(0);
  });

  it('returns sales in changes', async () => {
    const prisma = makePrisma();
    const now = new Date();
    (prisma.saleOrder.findMany as jest.Mock).mockResolvedValue([
      { id: 'sale-1', totalInPaise: 5000, paymentMethod: 'CASH',
        date: now, notes: null, status: 'completed', createdAt: now },
    ]);
    const service = makeService(prisma);
    const result = await service.pullChanges(BIZ_ID, 0);
    const saleLine = result.changes.find(c => c.entity === 'sale');
    expect(saleLine).toBeDefined();
    expect(saleLine?.id).toBe('sale-1');
  });
});
