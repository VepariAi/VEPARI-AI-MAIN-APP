// Unit tests for Business Health Score — PROMPT 139.
//
// Acceptance criterion: the health score correctly reflects business state;
// critical risks drive the score down; opportunities lift it.

import { NotFoundException } from '@nestjs/common';
import { HealthScoreService } from '../health-score.service';
import type { InsightReport, Insight } from '../insight.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeInsight(
  type: Insight['type'],
  severity: Insight['severity'],
  title = 'Test Insight',
): Insight {
  return { type, severity, title, description: '', evidence: {} };
}

function makeReport(overrides: Partial<InsightReport> = {}): InsightReport {
  return {
    businessId: 'biz-1',
    generatedAt: new Date('2026-01-01'),
    trends: [],
    anomalies: [],
    opportunities: [],
    risks: [],
    ...overrides,
  };
}

function makePrisma(found = true) {
  return {
    business: {
      findUnique: jest.fn().mockResolvedValue(found ? { id: 'biz-1' } : null),
    },
  };
}

function makeInsightService(report: InsightReport) {
  return { generateInsights: jest.fn().mockResolvedValue(report) };
}

function makeService(prisma: ReturnType<typeof makePrisma>, insightService: { generateInsights: jest.Mock }) {
  return new HealthScoreService(prisma as never, insightService as never);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('HealthScoreService.getHealthScore()', () => {
  it('throws NotFoundException when business does not exist', async () => {
    const svc = makeService(makePrisma(false), makeInsightService(makeReport()));
    await expect(svc.getHealthScore('no-biz')).rejects.toThrow(NotFoundException);
  });

  it('returns a healthy score when there are no insights', async () => {
    const svc = makeService(makePrisma(), makeInsightService(makeReport()));
    const result = await svc.getHealthScore('biz-1');

    // Growth dimension starts at 50 (neutral — no trend evidence), so overall
    // is 0.5*100 + 0.3*100 + 0.2*50 = 90 rather than a perfect 100.
    expect(result.overallScore).toBe(90);
    expect(result.grade).toBe('healthy');
    expect(result.criticalInsightCount).toBe(0);
    expect(result.opportunityCount).toBe(0);
  });

  it('score is bounded [0, 100] even with many critical risks', async () => {
    const manyRisks = Array.from({ length: 10 }, () => makeInsight('risk', 'critical'));
    const svc = makeService(makePrisma(), makeInsightService(makeReport({ risks: manyRisks })));
    const result = await svc.getHealthScore('biz-1');

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('a single critical risk reduces the score below 100', async () => {
    const svc = makeService(makePrisma(), makeInsightService(makeReport({
      risks: [makeInsight('risk', 'critical')],
    })));
    const result = await svc.getHealthScore('biz-1');

    expect(result.overallScore).toBeLessThan(100);
  });

  it('critical risks produce a lower score than warning risks', async () => {
    const criticalReport = makeReport({ risks: [makeInsight('risk', 'critical')] });
    const warningReport = makeReport({ risks: [makeInsight('risk', 'warning')] });

    const [critical, warning] = await Promise.all([
      makeService(makePrisma(), makeInsightService(criticalReport)).getHealthScore('biz-1'),
      makeService(makePrisma(), makeInsightService(warningReport)).getHealthScore('biz-1'),
    ]);

    expect(critical.overallScore).toBeLessThan(warning.overallScore);
  });

  it('opportunities increase the score compared to no opportunities', async () => {
    const withOpps = makeReport({
      opportunities: [
        makeInsight('opportunity', 'info'),
        makeInsight('opportunity', 'info'),
      ],
    });
    const without = makeReport();

    const [withScore, withoutScore] = await Promise.all([
      makeService(makePrisma(), makeInsightService(withOpps)).getHealthScore('biz-1'),
      makeService(makePrisma(), makeInsightService(without)).getHealthScore('biz-1'),
    ]);

    expect(withScore.overallScore).toBeGreaterThan(withoutScore.overallScore);
  });

  it('criticalInsightCount counts critical risks AND critical anomalies', async () => {
    const report = makeReport({
      risks: [makeInsight('risk', 'critical'), makeInsight('risk', 'warning')],
      anomalies: [makeInsight('anomaly', 'critical')],
    });
    const svc = makeService(makePrisma(), makeInsightService(report));
    const result = await svc.getHealthScore('biz-1');

    expect(result.criticalInsightCount).toBe(2); // 1 critical risk + 1 critical anomaly
  });

  it('opportunityCount reflects the number of opportunity insights', async () => {
    const report = makeReport({
      opportunities: [makeInsight('opportunity', 'info'), makeInsight('opportunity', 'warning')],
    });
    const svc = makeService(makePrisma(), makeInsightService(report));
    const result = await svc.getHealthScore('biz-1');

    expect(result.opportunityCount).toBe(2);
  });

  it('returns exactly three dimensions (Financial Risk, Stability, Growth)', async () => {
    const svc = makeService(makePrisma(), makeInsightService(makeReport()));
    const result = await svc.getHealthScore('biz-1');

    const names = result.dimensions.map(d => d.dimension);
    expect(names).toContain('Financial Risk');
    expect(names).toContain('Stability');
    expect(names).toContain('Growth');
    expect(result.dimensions).toHaveLength(3);
  });

  it('each dimension score is an integer in [0, 100]', async () => {
    const report = makeReport({
      risks: [makeInsight('risk', 'critical'), makeInsight('risk', 'warning')],
      anomalies: [makeInsight('anomaly', 'warning')],
      opportunities: [makeInsight('opportunity', 'info')],
      trends: [makeInsight('trend', 'info')],
    });
    const svc = makeService(makePrisma(), makeInsightService(report));
    const result = await svc.getHealthScore('biz-1');

    for (const dim of result.dimensions) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(dim.score)).toBe(true);
    }
  });

  it('overall score is an integer', async () => {
    const svc = makeService(makePrisma(), makeInsightService(makeReport({
      risks: [makeInsight('risk', 'warning')],
    })));
    const result = await svc.getHealthScore('biz-1');

    expect(Number.isInteger(result.overallScore)).toBe(true);
  });

  it('grade matches the overall score band', async () => {
    const report = makeReport({
      risks: Array.from({ length: 4 }, () => makeInsight('risk', 'critical')),
    });
    const svc = makeService(makePrisma(), makeInsightService(report));
    const result = await svc.getHealthScore('biz-1');

    expect(['critical', 'at_risk', 'fair', 'good', 'healthy']).toContain(result.grade);
    if (result.overallScore >= 80) expect(result.grade).toBe('healthy');
    else if (result.overallScore >= 60) expect(result.grade).toBe('good');
    else if (result.overallScore >= 40) expect(result.grade).toBe('fair');
    else if (result.overallScore >= 20) expect(result.grade).toBe('at_risk');
    else expect(result.grade).toBe('critical');
  });

  it('insightCount on Financial Risk dimension equals risks array length', async () => {
    const risks = [makeInsight('risk', 'critical'), makeInsight('risk', 'info')];
    const report = makeReport({ risks });
    const svc = makeService(makePrisma(), makeInsightService(report));
    const result = await svc.getHealthScore('biz-1');

    const riskDim = result.dimensions.find(d => d.dimension === 'Financial Risk');
    expect(riskDim?.insightCount).toBe(2);
  });

  it('insightCount on Growth dimension equals trends + opportunities count', async () => {
    const report = makeReport({
      trends: [makeInsight('trend', 'info'), makeInsight('trend', 'info')],
      opportunities: [makeInsight('opportunity', 'warning')],
    });
    const svc = makeService(makePrisma(), makeInsightService(report));
    const result = await svc.getHealthScore('biz-1');

    const growthDim = result.dimensions.find(d => d.dimension === 'Growth');
    expect(growthDim?.insightCount).toBe(3); // 2 trends + 1 opportunity
  });

  it('passes businessId and generatedAt from the InsightReport', async () => {
    const generatedAt = new Date('2026-06-15T10:00:00Z');
    const report = makeReport({ businessId: 'biz-1', generatedAt });
    const svc = makeService(makePrisma(), makeInsightService(report));
    const result = await svc.getHealthScore('biz-1');

    expect(result.businessId).toBe('biz-1');
    expect(result.generatedAt).toEqual(generatedAt);
  });
});
