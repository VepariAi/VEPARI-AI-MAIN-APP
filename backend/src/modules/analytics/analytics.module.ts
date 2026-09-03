import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { InsightService } from './insight.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, InsightService],
  exports: [AnalyticsService, InsightService],
})
export class AnalyticsModule {}
