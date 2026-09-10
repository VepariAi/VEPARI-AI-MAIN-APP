// Unit tests for GrowthService — Prompts 142, 143.
// PrismaService is fully mocked — no DB connection required.

import { GrowthService } from '../growth.service';
import { NotFoundException } from '@nestjs/common';

const BIZ_ID = 'biz-growth-test';

function makePrisma(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    business: {
      findUnique: jest.fn().mockResolvedValue({ id: BIZ_ID, name: 'Test Kirana', type: 'RETAIL' }),
    },
    customer: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'c1', name: 'Ramesh', creditBalance: 600000n, createdAt: thirtyDaysAgo }, // VIP (₹6k owed)
        { id: 'c2', name: 'Suresh', creditBalance: 100000n, createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) }, // new
      ]),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'p1', name: 'Rice (5kg)', stock: 2, priceInPaise: 45000 },
        { id: 'p2', name: 'Dal (1kg)', stock: 3, priceInPaise: 12000 },
      ]),
    },
    saleOrder: {
      aggregate: jest.fn()
        .mockResolvedValueOnce({ _sum: { totalInPaise: 500000 }, _count: 25 })   // last 30 days
        .mockResolvedValueOnce({ _sum: { totalInPaise: 300000 } })                // current month
        .mockResolvedValueOnce({ _sum: { totalInPaise: 400000 } }),               // prev month
    },
    ...overrides,
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new GrowthService(prisma as unknown as ConstructorParameters<typeof GrowthService>[0]);
}

describe('GrowthService.getGrowthReport', () => {
  it('throws NotFoundException for unknown business', async () => {
    const prisma = makePrisma();
    (prisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const service = makeService(prisma);
    await expect(service.getGrowthReport('no-biz')).rejects.toThrow(NotFoundException);
  });

  it('returns a growth report with recommendations and customer segments', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    expect(report.businessId).toBe(BIZ_ID);
    expect(report.generatedAt).toBeInstanceOf(Date);
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(Array.isArray(report.customerSegments)).toBe(true);
  });

  it('generates credit recovery recommendation when customers owe > ₹500', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    const creditRec = report.recommendations.find(r => r.category === 'customer_retention');
    expect(creditRec).toBeDefined();
    expect(creditRec!.estimatedImpactInPaise).toBeGreaterThan(0);
  });

  it('generates restock recommendation when low-stock products exist', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    const inventoryRec = report.recommendations.find(r => r.category === 'inventory');
    expect(inventoryRec).toBeDefined();
    expect(inventoryRec!.priority).toBe('high');
  });

  it('generates revenue decline recommendation when this month < 80% of last month', async () => {
    const prisma = makePrisma();
    // current month = 300,000 paise; prev month = 400,000 paise → 75% → below 80%
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    const revenueRec = report.recommendations.find(r => r.category === 'revenue' && r.title.includes('declining'));
    expect(revenueRec).toBeDefined();
    expect(revenueRec!.priority).toBe('high');
  });

  it('computes totalReachableRevenuePaise as sum of high-priority impacts', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    const expected = report.recommendations
      .filter(r => r.priority === 'high')
      .reduce((s, r) => s + r.estimatedImpactInPaise, 0);
    expect(report.totalReachableRevenuePaise).toBe(expected);
  });

  it('classifies new customers (< 30 days) in new segment', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    const newSeg = report.customerSegments.find(s => s.segment === 'new');
    expect(newSeg).toBeDefined();
    expect(newSeg!.customerName).toBe('Suresh');
  });

  it('classifies high-credit customer as vip segment', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    const vipSeg = report.customerSegments.find(s => s.segment === 'vip');
    expect(vipSeg).toBeDefined();
    expect(vipSeg!.customerName).toBe('Ramesh');
    expect(vipSeg!.creditBalanceInPaise).toBe(600000);
  });

  it('returns empty segments when no customers', async () => {
    const prisma = makePrisma();
    (prisma.customer.findMany as jest.Mock).mockResolvedValue([]);
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);
    expect(report.customerSegments).toHaveLength(0);
  });

  it('generates no restock rec when all stock is healthy', async () => {
    const prisma = makePrisma();
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    const inventoryRec = report.recommendations.find(r => r.category === 'inventory');
    expect(inventoryRec).toBeUndefined();
  });

  it('amounts stay in paise (integer arithmetic throughout)', async () => {
    const prisma = makePrisma();
    const service = makeService(prisma);
    const report = await service.getGrowthReport(BIZ_ID);

    for (const rec of report.recommendations) {
      expect(Number.isInteger(rec.estimatedImpactInPaise)).toBe(true);
    }
    for (const seg of report.customerSegments) {
      expect(Number.isInteger(seg.creditBalanceInPaise)).toBe(true);
      expect(Number.isInteger(seg.estimatedLtvInPaise)).toBe(true);
    }
  });
});
