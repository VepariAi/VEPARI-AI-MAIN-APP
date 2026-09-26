// Market intelligence data model — PROMPT 140 (Phase 13).
// Tracks local price benchmarks, competitor observations, and market trends
// that an Indian MSME owner might record via voice or manual entry.
// Persisted in MySQL via Prisma (DL-011); aggregation runs in application code.

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type MarketObservationType =
  | 'PRICE_BENCHMARK'    // competitor price for a product/service
  | 'DEMAND_SIGNAL'      // observed surge or drop in demand
  | 'NEW_COMPETITOR'     // new player entered the local market
  | 'SCHEME_OPPORTUNITY' // government scheme or subsidy observed
  | 'SUPPLY_SHORTAGE'    // raw material or goods shortage noted
  | 'SEASONAL_TREND';    // recurring seasonal pattern observed

export interface MarketObservation {
  id: string;
  businessId: string;
  type: MarketObservationType;
  subject: string;                   // product/service/market the observation is about
  description: string;
  /** Observed price in paise (null for non-price observation types) */
  priceInPaise: number | null;
  /** Competitive price in paise for PRICE_BENCHMARK */
  competitorPriceInPaise: number | null;
  competitorName: string | null;
  locality: string | null;           // market/area, e.g. "Chandni Chowk", "Sector 14 market"
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  source: 'VOICE' | 'MANUAL';
  observedAt: Date;
  createdAt: Date;
}

export interface CreateObservationDto {
  type: MarketObservationType;
  subject: string;
  description: string;
  priceInPaise?: number;
  competitorPriceInPaise?: number;
  competitorName?: string;
  locality?: string;
  confidence?: MarketObservation['confidence'];
  source?: MarketObservation['source'];
  observedAt?: string;               // ISO date; defaults to now
}

export interface PriceBenchmark {
  subject: string;
  ourPriceInPaise: number | null;
  marketLow: number;
  marketHigh: number;
  marketAvg: number;
  sampleCount: number;
  lastObservedAt: Date;
}

export interface MarketSummary {
  totalObservations: number;
  byType: Record<MarketObservationType, number>;
  recentPriceBenchmarks: PriceBenchmark[];
  demandSignals: MarketObservation[];
  competitorCount: number;
}

interface ObservationRow {
  id: string;
  businessId: string;
  type: string;
  subject: string;
  description: string;
  priceInPaise: number | null;
  competitorPriceInPaise: number | null;
  competitorName: string | null;
  locality: string | null;
  confidence: string;
  source: string;
  observedAt: Date;
  createdAt: Date;
}

function toDomain(row: ObservationRow): MarketObservation {
  return {
    ...row,
    type: row.type as MarketObservationType,
    confidence: row.confidence as MarketObservation['confidence'],
    source: row.source as MarketObservation['source'],
  };
}

@Injectable()
export class MarketIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  async addObservation(businessId: string, dto: CreateObservationDto): Promise<MarketObservation> {
    const row = await this.prisma.marketObservation.create({
      data: {
        businessId,
        type: dto.type,
        subject: dto.subject.trim(),
        description: dto.description.trim(),
        priceInPaise: dto.priceInPaise ?? null,
        competitorPriceInPaise: dto.competitorPriceInPaise ?? null,
        competitorName: dto.competitorName?.trim() ?? null,
        locality: dto.locality?.trim() ?? null,
        confidence: dto.confidence ?? 'MEDIUM',
        source: dto.source ?? 'MANUAL',
        observedAt: dto.observedAt ? new Date(dto.observedAt) : new Date(),
      },
    });
    return toDomain(row as ObservationRow);
  }

  async listObservations(
    businessId: string,
    type?: MarketObservationType,
    limit = 50,
  ): Promise<MarketObservation[]> {
    const rows = await this.prisma.marketObservation.findMany({
      where: { businessId, ...(type ? { type } : {}) },
      orderBy: { observedAt: 'desc' },
      take: limit,
    });
    return rows.map(r => toDomain(r as ObservationRow));
  }

  async getObservation(businessId: string, id: string): Promise<MarketObservation> {
    const row = await this.prisma.marketObservation.findFirst({ where: { id, businessId } });
    if (!row) throw new NotFoundException('Observation not found');
    return toDomain(row as ObservationRow);
  }

  /** Aggregate price benchmarks for a subject from all PRICE_BENCHMARK observations. */
  async getPriceBenchmarks(businessId: string): Promise<PriceBenchmark[]> {
    const rows = await this.prisma.marketObservation.findMany({
      where: { businessId, type: 'PRICE_BENCHMARK', competitorPriceInPaise: { not: null } },
    });
    const list = rows.map(r => toDomain(r as ObservationRow));

    const bySubject = new Map<string, MarketObservation[]>();
    for (const o of list) {
      const key = o.subject.toLowerCase();
      if (!bySubject.has(key)) bySubject.set(key, []);
      bySubject.get(key)!.push(o);
    }

    return Array.from(bySubject.entries()).map(([, obs]) => {
      const prices = obs.map(o => o.competitorPriceInPaise!);
      const marketLow = Math.min(...prices);
      const marketHigh = Math.max(...prices);
      const marketAvg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
      const lastObservedAt = obs.reduce(
        (latest, o) => (o.observedAt > latest ? o.observedAt : latest),
        obs[0]!.observedAt,
      );
      return {
        subject: obs[0]!.subject,
        ourPriceInPaise: obs[0]!.priceInPaise,
        marketLow,
        marketHigh,
        marketAvg,
        sampleCount: prices.length,
        lastObservedAt,
      };
    });
  }

  async getSummary(businessId: string): Promise<MarketSummary> {
    const rows = await this.prisma.marketObservation.findMany({ where: { businessId } });
    const list = rows.map(r => toDomain(r as ObservationRow));

    const byType = {} as Record<MarketObservationType, number>;
    const types: MarketObservationType[] = [
      'PRICE_BENCHMARK', 'DEMAND_SIGNAL', 'NEW_COMPETITOR',
      'SCHEME_OPPORTUNITY', 'SUPPLY_SHORTAGE', 'SEASONAL_TREND',
    ];
    for (const t of types) byType[t] = 0;
    for (const o of list) byType[o.type]++;

    const competitorNames = new Set(
      list
        .filter(o => o.competitorName)
        .map(o => o.competitorName!.toLowerCase()),
    );

    const benchmarks = await this.getPriceBenchmarks(businessId);

    return {
      totalObservations: list.length,
      byType,
      recentPriceBenchmarks: benchmarks.slice(0, 5),
      demandSignals: list.filter(o => o.type === 'DEMAND_SIGNAL').slice(0, 5),
      competitorCount: competitorNames.size,
    };
  }

  async deleteObservation(businessId: string, id: string): Promise<void> {
    const existing = await this.prisma.marketObservation.findFirst({ where: { id, businessId } });
    if (!existing) throw new NotFoundException('Observation not found');
    await this.prisma.marketObservation.delete({ where: { id } });
  }
}
