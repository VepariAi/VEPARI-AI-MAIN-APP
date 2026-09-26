// In-process metrics registry — PROMPT 212 (metrics & monitoring).
//
// A dependency-free counter/histogram registry. Kept in-process because the
// deployment target is a single Fastify instance per container; a Prometheus
// scrape endpoint (/metrics) exposes the snapshot in text exposition format.
// No external metrics client is pulled in — this stays lightweight and testable.

import { Injectable } from '@nestjs/common';

export interface HistogramSnapshot {
  count: number;
  sumMs: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
}

// Fixed latency buckets (ms) for HTTP request duration histograms.
const LATENCY_BUCKETS_MS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

function labelKey(name: string, labels?: Record<string, string>): string {
  if (!labels || Object.keys(labels).length === 0) return name;
  const parts = Object.keys(labels)
    .sort()
    .map(k => `${k}="${labels[k]}"`)
    .join(',');
  return `${name}{${parts}}`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx]!;
}

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  // Bounded sample buffers per series — cap prevents unbounded memory growth.
  private readonly samples = new Map<string, number[]>();
  private static readonly MAX_SAMPLES = 2048;

  /** Increment a named counter by `value` (default 1). */
  increment(name: string, labels?: Record<string, string>, value = 1): void {
    const key = labelKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + value);
  }

  /** Record a duration observation (ms) into a histogram series. */
  observe(name: string, valueMs: number, labels?: Record<string, string>): void {
    const key = labelKey(name, labels);
    let buf = this.samples.get(key);
    if (!buf) {
      buf = [];
      this.samples.set(key, buf);
    }
    buf.push(valueMs);
    if (buf.length > MetricsService.MAX_SAMPLES) {
      buf.shift();
    }
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    return this.counters.get(labelKey(name, labels)) ?? 0;
  }

  getHistogram(name: string, labels?: Record<string, string>): HistogramSnapshot {
    const buf = this.samples.get(labelKey(name, labels)) ?? [];
    if (buf.length === 0) {
      return { count: 0, sumMs: 0, avgMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, maxMs: 0 };
    }
    const sorted = [...buf].sort((a, b) => a - b);
    const sumMs = sorted.reduce((acc, v) => acc + v, 0);
    return {
      count: sorted.length,
      sumMs,
      avgMs: Math.round(sumMs / sorted.length),
      p50Ms: Math.round(percentile(sorted, 50)),
      p95Ms: Math.round(percentile(sorted, 95)),
      p99Ms: Math.round(percentile(sorted, 99)),
      maxMs: Math.round(sorted[sorted.length - 1]!),
    };
  }

  /** Snapshot every series as a plain object (used by tests and JSON endpoint). */
  snapshot(): { counters: Record<string, number>; histograms: Record<string, HistogramSnapshot> } {
    const counters: Record<string, number> = {};
    for (const [k, v] of this.counters) counters[k] = v;

    const histograms: Record<string, HistogramSnapshot> = {};
    for (const key of this.samples.keys()) {
      const buf = this.samples.get(key) ?? [];
      const sorted = [...buf].sort((a, b) => a - b);
      const sumMs = sorted.reduce((acc, v) => acc + v, 0);
      histograms[key] = {
        count: sorted.length,
        sumMs,
        avgMs: sorted.length ? Math.round(sumMs / sorted.length) : 0,
        p50Ms: Math.round(percentile(sorted, 50)),
        p95Ms: Math.round(percentile(sorted, 95)),
        p99Ms: Math.round(percentile(sorted, 99)),
        maxMs: sorted.length ? Math.round(sorted[sorted.length - 1]!) : 0,
      };
    }
    return { counters, histograms };
  }

  /** Render Prometheus text exposition format. */
  toPrometheus(): string {
    const lines: string[] = [];
    for (const [key, value] of this.counters) {
      lines.push(`${this.toPromName(key)} ${value}`);
    }
    for (const key of this.samples.keys()) {
      const h = this.getHistogramByKey(key);
      const base = this.toPromName(key);
      lines.push(`${this.withSuffix(base, 'count')} ${h.count}`);
      lines.push(`${this.withSuffix(base, 'sum_ms')} ${h.sumMs}`);
      lines.push(`${this.withSuffix(base, 'p50_ms')} ${h.p50Ms}`);
      lines.push(`${this.withSuffix(base, 'p95_ms')} ${h.p95Ms}`);
      lines.push(`${this.withSuffix(base, 'p99_ms')} ${h.p99Ms}`);
    }
    return lines.join('\n') + '\n';
  }

  /** Reset all series — used between test cases. */
  reset(): void {
    this.counters.clear();
    this.samples.clear();
  }

  /** Expose configured bucket boundaries (documentation / future use). */
  static buckets(): readonly number[] {
    return LATENCY_BUCKETS_MS;
  }

  private getHistogramByKey(key: string): HistogramSnapshot {
    const buf = this.samples.get(key) ?? [];
    const sorted = [...buf].sort((a, b) => a - b);
    const sumMs = sorted.reduce((acc, v) => acc + v, 0);
    return {
      count: sorted.length,
      sumMs,
      avgMs: sorted.length ? Math.round(sumMs / sorted.length) : 0,
      p50Ms: Math.round(percentile(sorted, 50)),
      p95Ms: Math.round(percentile(sorted, 95)),
      p99Ms: Math.round(percentile(sorted, 99)),
      maxMs: sorted.length ? Math.round(sorted[sorted.length - 1]!) : 0,
    };
  }

  private toPromName(key: string): string {
    // Keep the {labels} suffix intact; sanitize only the metric name portion.
    const braceIdx = key.indexOf('{');
    const name = braceIdx === -1 ? key : key.slice(0, braceIdx);
    const suffix = braceIdx === -1 ? '' : key.slice(braceIdx);
    return name.replace(/[^a-zA-Z0-9_]/g, '_') + suffix;
  }

  private withSuffix(promKeyWithLabels: string, suffix: string): string {
    const braceIdx = promKeyWithLabels.indexOf('{');
    if (braceIdx === -1) return `${promKeyWithLabels}_${suffix}`;
    const name = promKeyWithLabels.slice(0, braceIdx);
    const labels = promKeyWithLabels.slice(braceIdx);
    return `${name}_${suffix}${labels}`;
  }
}
