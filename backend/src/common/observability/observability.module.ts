// Observability module — PROMPTS 210-214.
//
// Provides the metrics registry, structured logger, alerting engine, and the
// HTTP logging/timing interceptor as a globally available module so any
// feature module can inject MetricsService or StructuredLogger.

import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService } from './metrics.service';
import { StructuredLogger } from './structured-logger.service';
import { AlertingService } from './alerting.service';
import { LoggingInterceptor } from './logging.interceptor';
import { MetricsController } from './metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    StructuredLogger,
    AlertingService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [MetricsService, StructuredLogger, AlertingService],
})
export class ObservabilityModule {}
