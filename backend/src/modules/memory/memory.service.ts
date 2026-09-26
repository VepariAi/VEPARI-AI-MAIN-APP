// Business Brain memory hierarchy — four distinct layers with separate
// retrieval rules and freshness handling (Database·Storage §82).
//
// Layer 1 — User Memory:        per-user, TTL 7 days  (durable, in DB)
// Layer 2 — Business Memory:    per-business, TTL 24h (durable, in DB)
// Layer 3 — Operational Context: per-business, TTL 15m (in-process cache)
// Layer 4 — Conversation Context: per-session, no TTL (caller-managed)

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Public interfaces ────────────────────────────────────────────────────────

export interface UserMemorySnapshot {
  userId: string;
  preferredLanguage: string;
  communicationStyle: 'terse' | 'detailed' | 'default';
  frequentActions: string[];
  refreshedAt: Date;
  /** true when the snapshot is fresh (age < TTL) */
  isFresh: boolean;
}

export interface BusinessMemorySnapshot {
  businessId: string;
  topCustomers: Array<{ id: string; name: string; totalSalesInPaise: number }>;
  topProducts: Array<{ id: string; name: string; totalSold: number }>;
  recentTrends: { salesGrowthBps: number; topCategory: string | null };
  refreshedAt: Date;
  isFresh: boolean;
}

export interface OperationalContext {
  businessId: string;
  todaySalesInPaise: number;
  todayExpensesInPaise: number;
  lowStockProductCount: number;
  openCreditCount: number;
  cachedAt: Date;
  /** true when cached value is still within the 15-minute window */
  isFresh: boolean;
}

export interface ConversationContext {
  sessionId: string;
  turns: Array<{ role: 'user' | 'assistant'; content: string; at: Date }>;
  mentionedEntities: Array<{ type: 'customer' | 'supplier' | 'product'; name: string }>;
}

export interface BrainContext {
  userMemory: UserMemorySnapshot;
  businessMemory: BusinessMemorySnapshot;
  operationalContext: OperationalContext;
  conversationContext: ConversationContext;
}

// ── TTLs ────────────────────────────────────────────────────────────────────

const USER_MEMORY_TTL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
const BUSINESS_MEMORY_TTL_MS = 24 * 60 * 60 * 1000;    // 24 hours
const OPERATIONAL_CONTEXT_TTL_MS = 15 * 60 * 1000;     // 15 minutes

// ── In-process operational context cache ────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  cachedAt: Date;
}

@Injectable()
export class MemoryService {
  private readonly operationalCache = new Map<string, CacheEntry<Omit<OperationalContext, 'isFresh'>>>();

  constructor(private readonly prisma: PrismaService) {}

  // ── Layer 1: User Memory ─────────────────────────────────────────────────

  async getUserMemory(userId: string): Promise<UserMemorySnapshot> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const record = await this.prisma.userMemory.findUnique({ where: { userId } });
    const now = Date.now();

    if (record) {
      const ageMs = now - record.refreshedAt.getTime();
      const isFresh = ageMs < USER_MEMORY_TTL_MS;
      const snap = record.snapshot as Record<string, unknown>;
      return {
        userId,
        preferredLanguage: (snap['preferredLanguage'] as string | undefined) ?? user.language,
        communicationStyle: (snap['communicationStyle'] as UserMemorySnapshot['communicationStyle'] | undefined) ?? 'default',
        frequentActions: (snap['frequentActions'] as string[] | undefined) ?? [],
        refreshedAt: record.refreshedAt,
        isFresh,
      };
    }

    // No record — bootstrap from the user profile
    const defaultSnapshot = {
      preferredLanguage: user.language,
      communicationStyle: 'default',
      frequentActions: [],
    };
    const created = await this.prisma.userMemory.create({
      data: { userId, snapshot: defaultSnapshot },
    });
    return {
      userId,
      preferredLanguage: user.language,
      communicationStyle: 'default',
      frequentActions: [],
      refreshedAt: created.refreshedAt,
      isFresh: true,
    };
  }

  async refreshUserMemory(
    userId: string,
    patch: Partial<Omit<UserMemorySnapshot, 'userId' | 'refreshedAt' | 'isFresh'>>,
  ): Promise<UserMemorySnapshot> {
    const current = await this.getUserMemory(userId);
    const merged = {
      preferredLanguage: patch.preferredLanguage ?? current.preferredLanguage,
      communicationStyle: patch.communicationStyle ?? current.communicationStyle,
      frequentActions: patch.frequentActions ?? current.frequentActions,
    };
    await this.prisma.userMemory.upsert({
      where: { userId },
      update: { snapshot: merged, refreshedAt: new Date(), version: { increment: 1 } },
      create: { userId, snapshot: merged },
    });
    return this.getUserMemory(userId);
  }

  // ── Layer 2: Business Memory ──────────────────────────────────────────────

  async getBusinessMemory(businessId: string): Promise<BusinessMemorySnapshot> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const record = await this.prisma.businessMemory.findUnique({ where: { businessId } });
    const now = Date.now();

    if (record) {
      const ageMs = now - record.refreshedAt.getTime();
      const isFresh = ageMs < BUSINESS_MEMORY_TTL_MS;
      if (isFresh) {
        return this.deserializeBusinessSnapshot(businessId, record.snapshot as Record<string, unknown>, record.refreshedAt, true);
      }
    }

    // Stale or missing — rebuild from live data
    return this.rebuildBusinessMemory(businessId);
  }

  private async rebuildBusinessMemory(businessId: string): Promise<BusinessMemorySnapshot> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [topCustomers, topProducts] = await Promise.all([
      this.prisma.saleOrder.groupBy({
        by: ['customerId'],
        where: { businessId, date: { gte: thirtyDaysAgo }, customerId: { not: null } },
        _sum: { totalInPaise: true },
        orderBy: { _sum: { totalInPaise: 'desc' } },
        take: 5,
      }),
      this.prisma.saleOrderItem.groupBy({
        by: ['productId'],
        where: { saleOrder: { businessId, date: { gte: thirtyDaysAgo } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Resolve customer names
    const customerIds = topCustomers.map(c => c.customerId).filter(Boolean) as string[];
    const customerRecords = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true },
    });
    const customerMap = new Map(customerRecords.map(c => [c.id, c.name]));

    // Resolve product names
    const productIds = topProducts.map(p => p.productId);
    const productRecords = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(productRecords.map(p => [p.id, p.name]));

    const snapshot = {
      topCustomers: topCustomers.map(c => ({
        id: c.customerId as string,
        name: customerMap.get(c.customerId as string) ?? 'Unknown',
        totalSalesInPaise: c._sum.totalInPaise ?? 0,
      })),
      topProducts: topProducts.map(p => ({
        id: p.productId,
        name: productMap.get(p.productId) ?? 'Unknown',
        totalSold: p._sum.quantity ?? 0,
      })),
      recentTrends: { salesGrowthBps: 0, topCategory: null as string | null },
    };

    const now = new Date();
    await this.prisma.businessMemory.upsert({
      where: { businessId },
      update: { snapshot, refreshedAt: now, version: { increment: 1 } },
      create: { businessId, snapshot },
    });

    return this.deserializeBusinessSnapshot(businessId, snapshot, now, true);
  }

  private deserializeBusinessSnapshot(
    businessId: string,
    snap: Record<string, unknown>,
    refreshedAt: Date,
    isFresh: boolean,
  ): BusinessMemorySnapshot {
    return {
      businessId,
      topCustomers: (snap['topCustomers'] as BusinessMemorySnapshot['topCustomers']) ?? [],
      topProducts: (snap['topProducts'] as BusinessMemorySnapshot['topProducts']) ?? [],
      recentTrends: (snap['recentTrends'] as BusinessMemorySnapshot['recentTrends']) ?? { salesGrowthBps: 0, topCategory: null },
      refreshedAt,
      isFresh,
    };
  }

  // ── Layer 3: Operational Context (in-process cache, TTL 15 min) ───────────

  async getOperationalContext(businessId: string): Promise<OperationalContext> {
    const cached = this.operationalCache.get(businessId);
    if (cached) {
      const ageMs = Date.now() - cached.cachedAt.getTime();
      if (ageMs < OPERATIONAL_CONTEXT_TTL_MS) {
        return { ...cached.value, isFresh: true };
      }
    }
    return this.refreshOperationalContext(businessId);
  }

  private async refreshOperationalContext(businessId: string): Promise<OperationalContext> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [salesAgg, expensesAgg, lowStockCount, openCreditCount] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        where: { businessId, date: { gte: todayStart, lte: todayEnd } },
        _sum: { totalInPaise: true },
      }),
      this.prisma.expense.aggregate({
        where: { businessId, date: { gte: todayStart, lte: todayEnd } },
        _sum: { amountInPaise: true },
      }),
      this.prisma.product.count({
        where: {
          businessId,
          isActive: true,
          lowStockThreshold: { not: null },
          // stock <= lowStockThreshold — Prisma raw approach using lte on stock
          AND: [{ stock: { lte: 10 } }],
        },
      }),
      this.prisma.customer.count({
        where: { businessId, isActive: true, creditBalance: { gt: 0 } },
      }),
    ]);

    const now = new Date();
    const entry = {
      businessId,
      todaySalesInPaise: salesAgg._sum.totalInPaise ?? 0,
      todayExpensesInPaise: expensesAgg._sum.amountInPaise ?? 0,
      lowStockProductCount: lowStockCount,
      openCreditCount,
      cachedAt: now,
    };
    this.operationalCache.set(businessId,{ value: entry, cachedAt: now });
    return { ...entry, isFresh: true };
  }

  invalidateOperationalContext(businessId: string): void {
    this.operationalCache.delete(businessId);
  }

  // ── Layer 4: Conversation Context (caller-managed, session-scoped) ────────

  createConversationContext(sessionId: string): ConversationContext {
    return { sessionId, turns: [], mentionedEntities: [] };
  }

  appendTurn(
    ctx: ConversationContext,
    role: 'user' | 'assistant',
    content: string,
    entities?: ConversationContext['mentionedEntities'],
  ): ConversationContext {
    return {
      ...ctx,
      turns: [...ctx.turns, { role, content, at: new Date() }],
      mentionedEntities: [...ctx.mentionedEntities, ...(entities ?? [])],
    };
  }

  // ── Full hierarchy assembly ───────────────────────────────────────────────

  async assembleContext(
    userId: string,
    businessId: string,
    conversationCtx: ConversationContext,
  ): Promise<BrainContext> {
    const [userMemory, businessMemory, operationalContext] = await Promise.all([
      this.getUserMemory(userId),
      this.getBusinessMemory(businessId),
      this.getOperationalContext(businessId),
    ]);
    return { userMemory, businessMemory, operationalContext, conversationContext: conversationCtx };
  }
}
