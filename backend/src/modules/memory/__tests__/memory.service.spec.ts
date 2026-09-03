// Unit tests for MemoryService — verifies each layer has distinct retrieval
// rules and freshness handling.
//
// Layer 1 (User Memory):       TTL 7 days — stale = isFresh: false, fresh = true
// Layer 2 (Business Memory):   TTL 24h   — stale triggers rebuild from live data
// Layer 3 (Operational):       TTL 15min — in-process cache, invalidation supported
// Layer 4 (Conversation):      session-scoped, no DB; tested for append semantics

import { NotFoundException } from '@nestjs/common';
import { MemoryService } from '../memory.service';

const USER_ID = 'user-1';
const BIZ_ID = 'biz-1';

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    user: { findUnique: jest.fn().mockResolvedValue({ id: USER_ID, language: 'hi' }) },
    business: { findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID }) },
    userMemory: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    businessMemory: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    saleOrder: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalInPaise: 0 } }),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    expense: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amountInPaise: 0 } }),
    },
    product: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    customer: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    supplier: { findMany: jest.fn().mockResolvedValue([]) },
    saleOrderItem: { groupBy: jest.fn().mockResolvedValue([]) },
    ...overrides,
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new MemoryService(prisma as unknown as ConstructorParameters<typeof MemoryService>[0]);
}

// ── Layer 1: User Memory ───────────────────────────────────────────────────────

describe('MemoryService — Layer 1: User Memory', () => {
  it('returns isFresh:true when record is within 7-day TTL', async () => {
    const prisma = makePrisma();
    const freshDate = new Date(Date.now() - 60 * 1000); // 1 min ago
    prisma.userMemory.findUnique.mockResolvedValue({
      userId: USER_ID,
      snapshot: { preferredLanguage: 'hi', communicationStyle: 'terse', frequentActions: ['sale'] },
      refreshedAt: freshDate,
      version: 1,
    });

    const service = makeService(prisma);
    const result = await service.getUserMemory(USER_ID);

    expect(result.isFresh).toBe(true);
    expect(result.preferredLanguage).toBe('hi');
    expect(result.communicationStyle).toBe('terse');
  });

  it('returns isFresh:false when record is older than 7 days', async () => {
    const prisma = makePrisma();
    const staleDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    prisma.userMemory.findUnique.mockResolvedValue({
      userId: USER_ID,
      snapshot: { preferredLanguage: 'en', communicationStyle: 'default', frequentActions: [] },
      refreshedAt: staleDate,
      version: 1,
    });

    const service = makeService(prisma);
    const result = await service.getUserMemory(USER_ID);

    expect(result.isFresh).toBe(false);
  });

  it('bootstraps a new record when none exists, seeded from user profile', async () => {
    const prisma = makePrisma();
    prisma.userMemory.findUnique.mockResolvedValue(null);
    prisma.userMemory.create.mockResolvedValue({
      userId: USER_ID,
      snapshot: { preferredLanguage: 'hi', communicationStyle: 'default', frequentActions: [] },
      refreshedAt: new Date(),
      version: 1,
    });

    const service = makeService(prisma);
    const result = await service.getUserMemory(USER_ID);

    expect(result.preferredLanguage).toBe('hi'); // matches user.language
    expect(result.isFresh).toBe(true);
    expect(prisma.userMemory.create).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException for unknown user', async () => {
    const prisma = makePrisma();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const service = makeService(prisma);
    await expect(service.getUserMemory('bad-id')).rejects.toThrow(NotFoundException);
  });
});

// ── Layer 2: Business Memory ───────────────────────────────────────────────────

describe('MemoryService — Layer 2: Business Memory', () => {
  it('returns isFresh:true and skips rebuild when record is within 24h', async () => {
    const prisma = makePrisma();
    const freshDate = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
    prisma.businessMemory.findUnique.mockResolvedValue({
      businessId: BIZ_ID,
      snapshot: {
        topCustomers: [],
        topProducts: [],
        recentTrends: { salesGrowthBps: 0, topCategory: null },
      },
      refreshedAt: freshDate,
      version: 1,
    });

    const service = makeService(prisma);
    const result = await service.getBusinessMemory(BIZ_ID);

    expect(result.isFresh).toBe(true);
    // No groupBy queries when cache is fresh
    expect(prisma.saleOrder.groupBy).not.toHaveBeenCalled();
  });

  it('rebuilds from live data when record is older than 24h', async () => {
    const prisma = makePrisma();
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    prisma.businessMemory.findUnique.mockResolvedValue({
      businessId: BIZ_ID,
      snapshot: { topCustomers: [], topProducts: [], recentTrends: { salesGrowthBps: 0, topCategory: null } },
      refreshedAt: staleDate,
      version: 1,
    });
    prisma.businessMemory.upsert.mockResolvedValue({});

    const service = makeService(prisma);
    const result = await service.getBusinessMemory(BIZ_ID);

    expect(result.isFresh).toBe(true); // freshly rebuilt
    expect(prisma.saleOrder.groupBy).toHaveBeenCalled();
    expect(prisma.businessMemory.upsert).toHaveBeenCalled();
  });
});

// ── Layer 3: Operational Context ───────────────────────────────────────────────

describe('MemoryService — Layer 3: Operational Context', () => {
  it('caches the first result and returns isFresh:true on second call within 15 min', async () => {
    const prisma = makePrisma();
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 10000 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 5000 } });

    const service = makeService(prisma);

    // First call — populates cache
    const r1 = await service.getOperationalContext(BIZ_ID);
    // Second call — served from cache
    const r2 = await service.getOperationalContext(BIZ_ID);

    expect(r1.todaySalesInPaise).toBe(10000);
    expect(r2.todaySalesInPaise).toBe(10000);
    // DB queried only once
    expect(prisma.saleOrder.aggregate).toHaveBeenCalledTimes(1);
    expect(r1.isFresh).toBe(true);
    expect(r2.isFresh).toBe(true);
  });

  it('re-queries DB after invalidation', async () => {
    const prisma = makePrisma();
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 0 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 0 } });

    const service = makeService(prisma);
    await service.getOperationalContext(BIZ_ID);
    service.invalidateOperationalContext(BIZ_ID);
    await service.getOperationalContext(BIZ_ID);

    expect(prisma.saleOrder.aggregate).toHaveBeenCalledTimes(2);
  });

  it('amounts remain integer paise', async () => {
    const prisma = makePrisma();
    prisma.saleOrder.aggregate.mockResolvedValue({ _sum: { totalInPaise: 99999 } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amountInPaise: 33333 } });

    const service = makeService(prisma);
    service.invalidateOperationalContext(BIZ_ID); // ensure fresh fetch
    const r = await service.getOperationalContext(BIZ_ID);

    expect(Number.isInteger(r.todaySalesInPaise)).toBe(true);
    expect(Number.isInteger(r.todayExpensesInPaise)).toBe(true);
  });
});

// ── Layer 4: Conversation Context ─────────────────────────────────────────────

describe('MemoryService — Layer 4: Conversation Context', () => {
  it('creates an empty conversation context', () => {
    const service = makeService(makePrisma());
    const ctx = service.createConversationContext('session-1');

    expect(ctx.sessionId).toBe('session-1');
    expect(ctx.turns).toHaveLength(0);
    expect(ctx.mentionedEntities).toHaveLength(0);
  });

  it('appendTurn adds a turn immutably and preserves earlier turns', () => {
    const service = makeService(makePrisma());
    const ctx0 = service.createConversationContext('session-1');
    const ctx1 = service.appendTurn(ctx0, 'user', 'What are my sales today?');
    const ctx2 = service.appendTurn(ctx1, 'assistant', 'Your sales today are ₹1000.');

    expect(ctx0.turns).toHaveLength(0); // original unchanged
    expect(ctx1.turns).toHaveLength(1);
    expect(ctx2.turns).toHaveLength(2);
    expect(ctx2.turns[0]?.role).toBe('user');
    expect(ctx2.turns[1]?.role).toBe('assistant');
  });

  it('appends mentioned entities to the context', () => {
    const service = makeService(makePrisma());
    const ctx = service.createConversationContext('s1');
    const ctx2 = service.appendTurn(ctx, 'user', 'Check Ravi\'s balance', [
      { type: 'customer', name: 'Ravi' },
    ]);

    expect(ctx2.mentionedEntities).toHaveLength(1);
    expect(ctx2.mentionedEntities[0]?.name).toBe('Ravi');
  });
});
