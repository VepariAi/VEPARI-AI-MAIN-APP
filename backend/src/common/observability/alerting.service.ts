// Alerting rules engine — PROMPT 214 (alerting rules implementation).
//
// Evaluates the current metrics snapshot against declarative threshold rules
// and returns any firing alerts. This is the source of truth for "is the
// system unhealthy right now?"; a scheduler or the /metrics/alerts endpoint
// evaluates it. Rules are pure functions over the metrics snapshot so they
// are trivially testable.

import { Injectable } from '@nestjs/common';
import { MetricsService } from './metrics.service';

export type AlertSeverity = 'warning' | 'critical';

export interface AlertRule {
  id: string;
  description: string;
  severity: AlertSeverity;
  /** Returns a human-readable reason string when firing, else null. */
  evaluate(metrics: MetricsService): string | null;
}

export interface FiringAlert {
  id: string;
  description: string;
  severity: AlertSeverity;
  reason: string;
  firedAt: string;
}

// Sum a counter family across all label combinations by prefix match.
function sumByPrefix(metrics: MetricsService, prefix: string): number {
  const { counters } = metrics.snapshot();
  let total = 0;
  for (const [key, value] of Object.entries(counters)) {
    if (key === prefix || key.startsWith(prefix + '{')) total += value;
  }
  return total;
}

// Worst p95 across all route histograms sharing a metric prefix.
function maxP95(metrics: MetricsService, prefix: string): number {
  const { histograms } = metrics.snapshot();
  let worst = 0;
  for (const [key, h] of Object.entries(histograms)) {
    if (key === prefix || key.startsWith(prefix + '{')) {
      if (h.p95Ms > worst) worst = h.p95Ms;
    }
  }
  return worst;
}

@Injectable()
export class AlertingService {
  private readonly rules: AlertRule[] = [
    {
      id: 'high_5xx_error_rate',
      description: 'Server error rate exceeds 5% of total responses',
      severity: 'critical',
      evaluate: (m) => {
        const total = sumByPrefix(m, 'http_responses_total');
        const errors = sumByPrefix(m, 'http_errors_total');
        if (total < 20) return null; // not enough traffic to judge
        const rate = errors / total;
        return rate > 0.05
          ? `5xx error rate ${(rate * 100).toFixed(1)}% over ${total} responses`
          : null;
      },
    },
    {
      id: 'slow_request_p95',
      description: 'Request p95 latency exceeds 2000ms',
      severity: 'warning',
      evaluate: (m) => {
        const p95 = maxP95(m, 'http_request_duration');
        return p95 > 2000 ? `Worst route p95 latency is ${p95}ms` : null;
      },
    },
    {
      id: 'ai_provider_failures',
      description: 'AI provider failures detected',
      severity: 'warning',
      evaluate: (m) => {
        const failures = sumByPrefix(m, 'ai_provider_failures_total');
        return failures > 10 ? `${failures} AI provider failures since start` : null;
      },
    },
  ];

  constructor(private readonly metrics: MetricsService) {}

  /** Register an additional rule (used by feature modules and tests). */
  registerRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /** Evaluate every rule and return the alerts that are currently firing. */
  evaluate(): FiringAlert[] {
    const now = new Date().toISOString();
    const firing: FiringAlert[] = [];
    for (const rule of this.rules) {
      const reason = rule.evaluate(this.metrics);
      if (reason) {
        firing.push({
          id: rule.id,
          description: rule.description,
          severity: rule.severity,
          reason,
          firedAt: now,
        });
      }
    }
    return firing;
  }

  listRules(): Array<Pick<AlertRule, 'id' | 'description' | 'severity'>> {
    return this.rules.map(({ id, description, severity }) => ({ id, description, severity }));
  }
}
