import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { InsightService } from './insight.service';
import { HealthScoreService } from './health-score.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, InsightService, HealthScoreService],
  exports: [AnalyticsService, InsightService, HealthScoreService],
})
export class AnalyticsModule {}
