// Unit tests for MarketIntelligenceService — PROMPT 140.
import { MarketIntelligenceService } from '../market-intelligence.service';

describe('MarketIntelligenceService', () => {
  let service: MarketIntelligenceService;

  beforeEach(() => {
    service = new MarketIntelligenceService();
  });

  describe('addObservation', () => {
    it('creates a price benchmark observation', () => {
      const obs = service.addObservation('biz-1', {
        type: 'PRICE_BENCHMARK',
        subject: 'Rice (1kg)',
        description: 'Competitor selling at ₹45',
        competitorPriceInPaise: 4500,
        competitorName: 'Sharma Kirana',
        priceInPaise: 5000,
      });
      expect(obs.id).toMatch(/^mkt_/);
      expect(obs.type).toBe('PRICE_BENCHMARK');
      expect(obs.competitorPriceInPaise).toBe(4500);
      expect(obs.businessId).toBe('biz-1');
    });

    it('sets defaults for optional fields', () => {
      const obs = service.addObservation('biz-1', {
        type: 'DEMAND_SIGNAL',
        subject: 'Diwali lights',
        description: 'High demand for decorative lights',
      });
      expect(obs.confidence).toBe('MEDIUM');
      expect(obs.source).toBe('MANUAL');
      expect(obs.priceInPaise).toBeNull();
      expect(obs.competitorPriceInPaise).toBeNull();
    });
  });

  describe('listObservations', () => {
    beforeEach(() => {
      service.addObservation('biz-1', { type: 'PRICE_BENCHMARK', subject: 'Rice', description: 'Benchmark', competitorPriceInPaise: 4500 });
      service.addObservation('biz-1', { type: 'DEMAND_SIGNAL', subject: 'Wheat', description: 'High demand' });
      service.addObservation('biz-1', { type: 'NEW_COMPETITOR', subject: 'New shop', description: 'New shop opened' });
    });

    it('returns all observations without filter', () => {
      const obs = service.listObservations('biz-1');
      expect(obs.length).toBe(3);
    });

    it('filters by type', () => {
      const obs = service.listObservations('biz-1', 'DEMAND_SIGNAL');
      expect(obs).toHaveLength(1);
      expect(obs[0]!.type).toBe('DEMAND_SIGNAL');
    });

    it('isolates by businessId', () => {
      service.addObservation('biz-2', { type: 'DEMAND_SIGNAL', subject: 'Mango', description: 'Seasonal demand' });
      expect(service.listObservations('biz-2')).toHaveLength(1);
      expect(service.listObservations('biz-1')).toHaveLength(3);
    });
  });

  describe('getPriceBenchmarks', () => {
    it('returns empty for no benchmarks', () => {
      expect(service.getPriceBenchmarks('biz-1')).toEqual([]);
    });

    it('aggregates multiple benchmarks for same subject', () => {
      service.addObservation('biz-1', { type: 'PRICE_BENCHMARK', subject: 'Rice', description: 'd1', competitorPriceInPaise: 4000 });
      service.addObservation('biz-1', { type: 'PRICE_BENCHMARK', subject: 'Rice', description: 'd2', competitorPriceInPaise: 5000 });
      service.addObservation('biz-1', { type: 'PRICE_BENCHMARK', subject: 'Rice', description: 'd3', competitorPriceInPaise: 4500 });

      const benchmarks = service.getPriceBenchmarks('biz-1');
      expect(benchmarks).toHaveLength(1);
      expect(benchmarks[0]!.subject).toBe('Rice');
      expect(benchmarks[0]!.marketLow).toBe(4000);
      expect(benchmarks[0]!.marketHigh).toBe(5000);
      expect(benchmarks[0]!.marketAvg).toBe(4500);
      expect(benchmarks[0]!.sampleCount).toBe(3);
    });
  });

  describe('getSummary', () => {
    it('returns zero counts for empty business', () => {
      const summary = service.getSummary('biz-empty');
      expect(summary.totalObservations).toBe(0);
      expect(summary.competitorCount).toBe(0);
    });

    it('counts unique competitors', () => {
      service.addObservation('biz-1', { type: 'PRICE_BENCHMARK', subject: 'Rice', description: 'd', competitorName: 'Sharma Store', competitorPriceInPaise: 4000 });
      service.addObservation('biz-1', { type: 'PRICE_BENCHMARK', subject: 'Dal', description: 'd', competitorName: 'Gupta Store', competitorPriceInPaise: 7000 });
      service.addObservation('biz-1', { type: 'PRICE_BENCHMARK', subject: 'Oil', description: 'd', competitorName: 'Sharma Store', competitorPriceInPaise: 12000 });

      const summary = service.getSummary('biz-1');
      expect(summary.competitorCount).toBe(2); // Sharma + Gupta (case-insensitive)
      expect(summary.byType['PRICE_BENCHMARK']).toBe(3);
    });
  });

  describe('deleteObservation', () => {
    it('removes an existing observation', () => {
      const obs = service.addObservation('biz-1', { type: 'DEMAND_SIGNAL', subject: 'Test', description: 'Test' });
      service.deleteObservation('biz-1', obs.id);
      expect(service.listObservations('biz-1')).toHaveLength(0);
    });

    it('throws NotFoundException for unknown id', () => {
      expect(() => service.deleteObservation('biz-1', 'unknown-id')).toThrow();
    });
  });
});
