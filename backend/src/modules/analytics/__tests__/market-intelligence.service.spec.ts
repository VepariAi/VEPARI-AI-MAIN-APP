// Unit tests for MarketIntelligenceService (Prisma/MySQL-backed) — PROMPT 140, DL-011.
// PrismaService fully mocked.

import { MarketIntelligenceService } from '../market-intelligence.service';
import { NotFoundException } from '@nestjs/common';

const BIZ = 'biz-1';

function row(over: Record<string, unknown> = {}) {
  return {
    id: 'mkt-1',
    businessId: BIZ,
    type: 'PRICE_BENCHMARK',
    subject: 'Rice',
    description: 'benchmark',
    priceInPaise: 5000,
    competitorPriceInPaise: 4500,
    competitorName: null,
    locality: null,
    confidence: 'MEDIUM',
    source: 'MANUAL',
    observedAt: new Date('2026-02-01'),
    createdAt: new Date('2026-02-01'),
    ...over,
  };
}

function makePrisma() {
  return {
    marketObservation: {
      create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => row(data)),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
}

function makeService(prisma: ReturnType<typeof makePrisma>) {
  return new MarketIntelligenceService(prisma as unknown as ConstructorParameters<typeof MarketIntelligenceService>[0]);
}

describe('addObservation', () => {
  it('creates with trimmed subject/description and defaults', async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    await svc.addObservation(BIZ, { type: 'DEMAND_SIGNAL', subject: '  Diwali lights  ', description: '  high demand  ' });
    const arg = (prisma.marketObservation.create as jest.Mock).mock.calls[0][0];
    expect(arg.data.subject).toBe('Diwali lights');
    expect(arg.data.description).toBe('high demand');
    expect(arg.data.confidence).toBe('MEDIUM');
    expect(arg.data.source).toBe('MANUAL');
    expect(arg.data.priceInPaise).toBeNull();
  });
});

describe('listObservations', () => {
  it('applies type filter and limit, scoped to business', async () => {
    const prisma = makePrisma();
    (prisma.marketObservation.findMany as jest.Mock).mockResolvedValue([row({ type: 'DEMAND_SIGNAL' })]);
    const svc = makeService(prisma);
    const obs = await svc.listObservations(BIZ, 'DEMAND_SIGNAL', 10);
    const arg = (prisma.marketObservation.findMany as jest.Mock).mock.calls[0][0];
    expect(arg.where).toEqual({ businessId: BIZ, type: 'DEMAND_SIGNAL' });
    expect(arg.take).toBe(10);
    expect(obs[0]!.type).toBe('DEMAND_SIGNAL');
  });
});

describe('getPriceBenchmarks', () => {
  it('returns empty when there are no benchmarks', async () => {
    const svc = makeService(makePrisma());
    expect(await svc.getPriceBenchmarks(BIZ)).toEqual([]);
  });

  it('aggregates multiple benchmarks for the same subject (integer paise)', async () => {
    const prisma = makePrisma();
    (prisma.marketObservation.findMany as jest.Mock).mockResolvedValue([
      row({ id: '1', subject: 'Rice', competitorPriceInPaise: 4000, priceInPaise: 5000 }),
      row({ id: '2', subject: 'Rice', competitorPriceInPaise: 5000, priceInPaise: 5000 }),
      row({ id: '3', subject: 'Rice', competitorPriceInPaise: 4500, priceInPaise: 5000 }),
    ]);
    const svc = makeService(prisma);
    const benchmarks = await svc.getPriceBenchmarks(BIZ);
    expect(benchmarks).toHaveLength(1);
    expect(benchmarks[0]!.marketLow).toBe(4000);
    expect(benchmarks[0]!.marketHigh).toBe(5000);
    expect(benchmarks[0]!.marketAvg).toBe(4500);
    expect(benchmarks[0]!.sampleCount).toBe(3);
    expect(Number.isInteger(benchmarks[0]!.marketAvg)).toBe(true);
  });
});

describe('getSummary', () => {
  it('counts unique competitors (case-insensitive) and by type', async () => {
    const prisma = makePrisma();
    const rows = [
      row({ id: '1', subject: 'Rice', competitorName: 'Sharma Store', competitorPriceInPaise: 4000 }),
      row({ id: '2', subject: 'Dal', competitorName: 'Gupta Store', competitorPriceInPaise: 7000 }),
      row({ id: '3', subject: 'Oil', competitorName: 'sharma store', competitorPriceInPaise: 12000 }),
    ];
    // findMany is called twice (summary-all, then benchmarks); return rows both times.
    (prisma.marketObservation.findMany as jest.Mock).mockResolvedValue(rows);
    const svc = makeService(prisma);
    const summary = await svc.getSummary(BIZ);
    expect(summary.totalObservations).toBe(3);
    expect(summary.competitorCount).toBe(2); // Sharma + Gupta
    expect(summary.byType['PRICE_BENCHMARK']).toBe(3);
  });

  it('returns zero counts for an empty business', async () => {
    const svc = makeService(makePrisma());
    const summary = await svc.getSummary('empty');
    expect(summary.totalObservations).toBe(0);
    expect(summary.competitorCount).toBe(0);
  });
});

describe('deleteObservation', () => {
  it('deletes an existing observation', async () => {
    const prisma = makePrisma();
    (prisma.marketObservation.findFirst as jest.Mock).mockResolvedValue(row());
    const svc = makeService(prisma);
    await svc.deleteObservation(BIZ, 'mkt-1');
    expect(prisma.marketObservation.delete).toHaveBeenCalledWith({ where: { id: 'mkt-1' } });
  });

  it('throws NotFound for an unknown id', async () => {
    const svc = makeService(makePrisma());
    await expect(svc.deleteObservation(BIZ, 'nope')).rejects.toThrow(NotFoundException);
  });
});
