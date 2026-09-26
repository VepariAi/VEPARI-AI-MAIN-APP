// Unit tests for AlertingService — PROMPT 214.

import { AlertingService } from '../alerting.service';
import { MetricsService } from '../metrics.service';

describe('AlertingService', () => {
  let metrics: MetricsService;
  let alerting: AlertingService;

  beforeEach(() => {
    metrics = new MetricsService();
    alerting = new AlertingService(metrics);
  });

  it('fires no alerts on a clean system', () => {
    expect(alerting.evaluate()).toHaveLength(0);
  });

  it('lists built-in rules', () => {
    const rules = alerting.listRules();
    expect(rules.length).toBeGreaterThanOrEqual(3);
    expect(rules.map(r => r.id)).toContain('high_5xx_error_rate');
  });

  it('fires critical alert when 5xx error rate exceeds 5%', () => {
    // 100 responses, 10 of them 5xx → 10% error rate
    for (let i = 0; i < 100; i++) {
      metrics.increment('http_responses_total', { status: '200' });
    }
    for (let i = 0; i < 10; i++) {
      metrics.increment('http_errors_total', { route: '/v1/sales' });
    }
    const firing = alerting.evaluate();
    const alert = firing.find(a => a.id === 'high_5xx_error_rate');
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe('critical');
    expect(alert!.reason).toContain('%');
  });

  it('does not fire error-rate alert below the traffic threshold', () => {
    // Only 5 responses total — not enough to judge
    for (let i = 0; i < 5; i++) metrics.increment('http_responses_total', { status: '500' });
    metrics.increment('http_errors_total');
    const firing = alerting.evaluate();
    expect(firing.find(a => a.id === 'high_5xx_error_rate')).toBeUndefined();
  });

  it('fires warning when p95 latency exceeds 2000ms', () => {
    for (let i = 0; i < 50; i++) metrics.observe('http_request_duration', 3000, { route: '/v1/reports' });
    const firing = alerting.evaluate();
    const alert = firing.find(a => a.id === 'slow_request_p95');
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe('warning');
  });

  it('fires warning when AI provider failures accumulate', () => {
    for (let i = 0; i < 15; i++) metrics.increment('ai_provider_failures_total', { provider: 'anthropic' });
    const firing = alerting.evaluate();
    expect(firing.find(a => a.id === 'ai_provider_failures')).toBeDefined();
  });

  it('supports registering custom rules', () => {
    alerting.registerRule({
      id: 'custom',
      description: 'always fires',
      severity: 'warning',
      evaluate: () => 'boom',
    });
    expect(alerting.evaluate().find(a => a.id === 'custom')).toBeDefined();
  });
});
