// Metrics & alerts endpoints — PROMPTS 212, 214.
//
// /metrics        — Prometheus text exposition format (for scrapers)
// /metrics/json   — JSON snapshot (for dashboards / debugging)
// /metrics/alerts — currently firing alerts from the alerting engine
//
// These are operational endpoints excluded from the /v1 API prefix. They must
// not leak business data — only aggregate counters and latencies are exposed.

import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AlertingService } from './alerting.service';

@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
    private readonly alerting: AlertingService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  prometheus(): string {
    return this.metrics.toPrometheus();
  }

  @Get('json')
  json() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics.snapshot(),
    };
  }

  @Get('alerts')
  alerts() {
    const firing = this.alerting.evaluate();
    return {
      timestamp: new Date().toISOString(),
      firingCount: firing.length,
      rules: this.alerting.listRules(),
      firing,
    };
  }
}
