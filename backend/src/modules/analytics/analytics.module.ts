import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { InsightService } from './insight.service';
import { HealthScoreService } from './health-score.service';
import { BriefingService } from '../ai/briefing.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, InsightService, HealthScoreService, BriefingService],
  exports: [AnalyticsService, InsightService, HealthScoreService, BriefingService],
})
export class AnalyticsModule {}
