import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { HealthScoreService } from './health-score.service';

@ApiTags('analytics')
@Controller('businesses/:businessId/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly healthScoreService: HealthScoreService,
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
}
