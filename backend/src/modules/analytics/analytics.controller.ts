import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { HealthScoreService } from './health-score.service';
import { InsightService } from './insight.service';
import { BriefingService } from '../ai/briefing.service';

@ApiTags('analytics')
@Controller('businesses/:businessId/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly healthScoreService: HealthScoreService,
    private readonly insightService: InsightService,
    private readonly briefingService: BriefingService,
  ) {}

  @Get('snapshot')
  @ApiOperation({ summary: 'Live business snapshot for today' })
  snapshot(@Param('businessId') businessId: string) {
    return this.analyticsService.getBusinessSnapshot(businessId);
  }

  @Get('health-score')
  @ApiOperation({ summary: 'Business Health Score (0–100) derived from live insight data' })
  healthScore(@Param('businessId') businessId: string) {
    return this.healthScoreService.getHealthScore(businessId);
  }

  @Get('insights')
  @ApiOperation({ summary: 'AI-generated insights: trends, anomalies, opportunities and risks' })
  insights(@Param('businessId') businessId: string) {
    return this.insightService.generateInsights(businessId);
  }

  @Get('daily')
  @ApiOperation({ summary: 'Daily summary aggregation for a specific date' })
  @ApiQuery({ name: 'date', description: 'YYYY-MM-DD (defaults to today)' })
  daily(
    @Param('businessId') businessId: string,
    @Query('date') date?: string,
  ) {
    const d = date ?? new Date().toISOString().slice(0, 10);
    return this.analyticsService.getDailySummary(businessId, d);
  }

  @Get('briefing')
  @ApiOperation({ summary: '"While you were away" briefing — real events since a checkpoint' })
  @ApiQuery({ name: 'since', required: false, description: 'ISO timestamp checkpoint (defaults to 24 hours ago)' })
  briefing(
    @Param('businessId') businessId: string,
    @Query('since') since?: string,
  ) {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.briefingService.generateBriefing(businessId, sinceDate);
  }
}
