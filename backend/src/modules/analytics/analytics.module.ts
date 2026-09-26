import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { InsightService } from './insight.service';
import { HealthScoreService } from './health-score.service';
import { GrowthService } from './growth.service';
import { SchemeMatchingService } from './scheme-matching.service';
import { MarketIntelligenceService } from './market-intelligence.service';
import { BriefingService } from '../ai/briefing.service';

@Module({
  imports: [AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, InsightService, HealthScoreService, GrowthService, SchemeMatchingService, MarketIntelligenceService, BriefingService],
  exports: [AnalyticsService, InsightService, HealthScoreService, GrowthService, SchemeMatchingService, MarketIntelligenceService, BriefingService],
})
export class AnalyticsModule {}
