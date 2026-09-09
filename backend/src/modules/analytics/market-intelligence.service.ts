// Market intelligence data model — PROMPT 140 (Phase 13).
// Tracks local price benchmarks, competitor observations, and market trends
// that an Indian MSME owner might record via voice or manual entry.
// Storage is in-memory for Phase 15; Prisma model added in Phase 16.

import { Injectable, NotFoundException } from '@nestjs/common';

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

@Injectable()
export class MarketIntelligenceService {
  private readonly store = new Map<string, MarketObservation[]>();

  private getList(businessId: string): MarketObservation[] {
    if (!this.store.has(businessId)) this.store.set(businessId, []);
    return this.store.get(businessId)!;
  }

  addObservation(businessId: string, dto: CreateObservationDto): MarketObservation {
    const obs: MarketObservation = {
      id: `mkt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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
      createdAt: new Date(),
    };
    this.getList(businessId).unshift(obs);
    return obs;
  }

  listObservations(
    businessId: string,
    type?: MarketObservationType,
    limit = 50,
  ): MarketObservation[] {
    const list = this.getList(businessId);
    const filtered = type ? list.filter(o => o.type === type) : list;
    return filtered.slice(0, limit);
  }

  getObservation(businessId: string, id: string): MarketObservation {
    const obs = this.getList(businessId).find(o => o.id === id);
    if (!obs) throw new NotFoundException('Observation not found');
    return obs;
  }

  /** Aggregate price benchmarks for a subject from all PRICE_BENCHMARK observations. */
  getPriceBenchmarks(businessId: string): PriceBenchmark[] {
    const list = this.getList(businessId).filter(
      o => o.type === 'PRICE_BENCHMARK' && o.competitorPriceInPaise !== null,
    );

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

  getSummary(businessId: string): MarketSummary {
    const list = this.getList(businessId);
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

    return {
      totalObservations: list.length,
      byType,
      recentPriceBenchmarks: this.getPriceBenchmarks(businessId).slice(0, 5),
      demandSignals: list.filter(o => o.type === 'DEMAND_SIGNAL').slice(0, 5),
      competitorCount: competitorNames.size,
    };
  }

  deleteObservation(businessId: string, id: string): void {
    const list = this.getList(businessId);
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1) throw new NotFoundException('Observation not found');
    list.splice(idx, 1);
  }
}
