// Business Health Score — PROMPT 139.
//
// Depends on InsightService (PROMPT 134). Computes a 0-100 score from
// the live insight report and breaks it into three diagnostic dimensions.
//
// Acceptance: health score reflects actual business state; critical risks
// drive the score down; opportunities and positive trends lift it.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightService } from './insight.service';
import type { Insight, InsightReport } from './insight.service';

// ── Public types ─────────────────────────────────────────────────────────────

export type HealthGrade = 'healthy' | 'good' | 'fair' | 'at_risk' | 'critical';

export interface DimensionScore {
  dimension: string;
  score: number;        // 0–100, integer
  grade: HealthGrade;
  insightCount: number;
}

export interface HealthScore {
  businessId: string;
  overallScore: number; // 0–100, integer
  grade: HealthGrade;
  dimensions: DimensionScore[];
  criticalInsightCount: number;
  opportunityCount: number;
  generatedAt: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function grade(score: number): HealthGrade {
  if (score >= 80) return 'healthy';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'at_risk';
  return 'critical';
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// Penalty points per severity for risk and anomaly dimensions
const RISK_PENALTY: Record<Insight['severity'], number> = {
  critical: 25,
  warning: 12,
  info: 6,
};

const ANOMALY_PENALTY: Record<Insight['severity'], number> = {
  critical: 20,
  warning: 10,
  info: 5,
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class HealthScoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insightService: InsightService,
  ) {}

  async getHealthScore(businessId: string): Promise<HealthScore> {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const report: InsightReport = await this.insightService.generateInsights(businessId);

    const riskScore = this.scoreRisks(report.risks);
    const anomalyScore = this.scoreAnomalies(report.anomalies);
    const growthScore = this.scoreGrowth(report.trends, report.opportunities);

    // Weighted overall: risk is the strongest signal
    const overall = Math.round(
      0.50 * riskScore +
      0.30 * anomalyScore +
      0.20 * growthScore,
    );

    const criticalInsightCount =
      report.risks.filter(i => i.severity === 'critical').length +
      report.anomalies.filter(i => i.severity === 'critical').length;

    const dimensions: DimensionScore[] = [
      {
        dimension: 'Financial Risk',
        score: riskScore,
        grade: grade(riskScore),
        insightCount: report.risks.length,
      },
      {
        dimension: 'Stability',
        score: anomalyScore,
        grade: grade(anomalyScore),
        insightCount: report.anomalies.length,
      },
      {
        dimension: 'Growth',
        score: growthScore,
        grade: grade(growthScore),
        insightCount: report.trends.length + report.opportunities.length,
      },
    ];

    return {
      businessId,
      overallScore: overall,
      grade: grade(overall),
      dimensions,
      criticalInsightCount,
      opportunityCount: report.opportunities.length,
      generatedAt: report.generatedAt,
    };
  }

  private scoreRisks(risks: Insight[]): number {
    const penalty = risks.reduce((sum, r) => sum + RISK_PENALTY[r.severity], 0);
    return clamp(100 - penalty);
  }

  private scoreAnomalies(anomalies: Insight[]): number {
    const penalty = anomalies.reduce((sum, a) => sum + ANOMALY_PENALTY[a.severity], 0);
    return clamp(100 - penalty);
  }

  private scoreGrowth(trends: Insight[], opportunities: Insight[]): number {
    // Neutral baseline: 50. Positive signals lift it; no risks in this dimension.
    const trendBonus = Math.min(trends.length * 5, 25);
    const opportunityBonus = Math.min(opportunities.length * 10, 30);
    return clamp(50 + trendBonus + opportunityBonus);
  }
}
