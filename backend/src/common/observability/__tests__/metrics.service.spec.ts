// Unit tests for MetricsService — PROMPT 212.

import { MetricsService } from '../metrics.service';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService();
  });

  describe('counters', () => {
    it('increments a counter by 1 by default', () => {
      metrics.increment('requests');
      metrics.increment('requests');
      expect(metrics.getCounter('requests')).toBe(2);
    });

    it('increments by an explicit value', () => {
      metrics.increment('bytes', undefined, 100);
      metrics.increment('bytes', undefined, 50);
      expect(metrics.getCounter('bytes')).toBe(150);
    });

    it('keeps counters separate per label set', () => {
      metrics.increment('http', { status: '200' });
      metrics.increment('http', { status: '200' });
      metrics.increment('http', { status: '500' });
      expect(metrics.getCounter('http', { status: '200' })).toBe(2);
      expect(metrics.getCounter('http', { status: '500' })).toBe(1);
    });

    it('returns 0 for an unknown counter', () => {
      expect(metrics.getCounter('missing')).toBe(0);
    });
  });

  describe('histograms', () => {
    it('computes count, avg and percentiles', () => {
      for (const v of [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]) {
        metrics.observe('latency', v);
      }
      const h = metrics.getHistogram('latency');
      expect(h.count).toBe(10);
      expect(h.sumMs).toBe(550);
      expect(h.avgMs).toBe(55);
      expect(h.maxMs).toBe(100);
      expect(h.p50Ms).toBeGreaterThan(0);
      expect(h.p95Ms).toBeGreaterThanOrEqual(h.p50Ms);
      expect(h.p99Ms).toBeGreaterThanOrEqual(h.p95Ms);
    });

    it('returns a zeroed snapshot for an empty histogram', () => {
      const h = metrics.getHistogram('none');
      expect(h.count).toBe(0);
      expect(h.avgMs).toBe(0);
      expect(h.p95Ms).toBe(0);
    });

    it('all histogram values are integers', () => {
      for (const v of [3, 7, 11, 13, 17]) metrics.observe('lat', v);
      const h = metrics.getHistogram('lat');
      expect(Number.isInteger(h.avgMs)).toBe(true);
      expect(Number.isInteger(h.p50Ms)).toBe(true);
      expect(Number.isInteger(h.p95Ms)).toBe(true);
      expect(Number.isInteger(h.p99Ms)).toBe(true);
    });
  });

  describe('snapshot & prometheus', () => {
    it('snapshot returns all counters and histograms', () => {
      metrics.increment('a');
      metrics.observe('b', 42);
      const snap = metrics.snapshot();
      expect(snap.counters['a']).toBe(1);
      expect(snap.histograms['b']!.count).toBe(1);
    });

    it('renders prometheus text with sanitized names', () => {
      metrics.increment('http_requests_total', { method: 'GET' });
      metrics.observe('http_request_duration', 25, { method: 'GET' });
      const text = metrics.toPrometheus();
      expect(text).toContain('http_requests_total');
      expect(text).toContain('http_request_duration_count');
      expect(text).toContain('http_request_duration_p95_ms');
      expect(text.endsWith('\n')).toBe(true);
    });

    it('reset clears all series', () => {
      metrics.increment('x');
      metrics.observe('y', 1);
      metrics.reset();
      expect(metrics.getCounter('x')).toBe(0);
      expect(metrics.getHistogram('y').count).toBe(0);
    });
  });
});
