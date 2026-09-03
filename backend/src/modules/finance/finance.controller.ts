import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinanceService } from './finance.service';

@ApiTags('finance')
@Controller('businesses/:businessId/finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('profit/today')
  @ApiOperation({ summary: 'Profit for today (paise, integer arithmetic)' })
  todayProfit(@Param('businessId') businessId: string) {
    return this.financeService.getTodayProfit(businessId);
  }

  @Get('profit/week')
  @ApiOperation({ summary: 'Profit for the last 7 days' })
  weekProfit(@Param('businessId') businessId: string) {
    return this.financeService.getWeekProfit(businessId);
  }

  @Get('profit/month')
  @ApiOperation({ summary: 'Profit month-to-date' })
  monthProfit(@Param('businessId') businessId: string) {
    return this.financeService.getMonthProfit(businessId);
  }

  @Get('profit/series')
  @ApiOperation({ summary: 'Daily profit series for charting' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' })
  dailySeries(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    return this.financeService.getDailySeries(businessId, days ? parseInt(days, 10) : undefined);
  }
}
