import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinanceService, BrsEntryInput } from './finance.service';

interface ImportBankStatementBody {
  label: string;
  entries: BrsEntryInput[];
}

@ApiTags('finance')
@Controller('businesses/:businessId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('finance/profit/today')
  @ApiOperation({ summary: 'Profit for today (paise, integer arithmetic)' })
  todayProfit(@Param('businessId') businessId: string) {
    return this.financeService.getTodayProfit(businessId);
  }

  @Get('finance/profit/week')
  @ApiOperation({ summary: 'Profit for the last 7 days' })
  weekProfit(@Param('businessId') businessId: string) {
    return this.financeService.getWeekProfit(businessId);
  }

  @Get('finance/profit/month')
  @ApiOperation({ summary: 'Profit month-to-date' })
  monthProfit(@Param('businessId') businessId: string) {
    return this.financeService.getMonthProfit(businessId);
  }

  @Get('finance/profit/series')
  @ApiOperation({ summary: 'Daily profit series for charting' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days (default 30)' })
  dailySeries(
    @Param('businessId') businessId: string,
    @Query('days') days?: string,
  ) {
    return this.financeService.getDailySeries(businessId, days ? parseInt(days, 10) : undefined);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List transactions (sales, expenses, purchases) newest first' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  listTransactions(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.financeService.listTransactions(
      businessId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  // ── BRS endpoints ──────────────────────────────────────────────────────────

  @Post('finance/brs/import')
  @ApiOperation({ summary: 'Import a bank statement and reconcile against recorded transactions' })
  importBankStatement(
    @Param('businessId') businessId: string,
    @Body() body: ImportBankStatementBody,
  ) {
    if (!body.label || !Array.isArray(body.entries)) {
      throw new BadRequestException('label and entries are required');
    }
    return this.financeService.importBankStatement(businessId, body.label, body.entries);
  }

  @Get('finance/brs')
  @ApiOperation({ summary: 'List bank statement imports for a business' })
  listBankStatementImports(@Param('businessId') businessId: string) {
    return this.financeService.listBankStatementImports(businessId);
  }

  @Get('finance/brs/:importId/reconcile')
  @ApiOperation({ summary: 'Run or re-run reconciliation for an imported bank statement' })
  reconcileImport(
    @Param('businessId') businessId: string,
    @Param('importId') importId: string,
  ) {
    return this.financeService.reconcileImport(businessId, importId);
  }
}
