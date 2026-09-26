import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { ReportsService, DateRange } from './reports.service';

function parseDateRange(from?: string, to?: string): DateRange {
  const now = new Date();
  const toDate = to ? new Date(to) : now;
  const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: fromDate, to: toDate };
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@Controller('businesses/:businessId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pl')
  @ApiOperation({ summary: 'Profit & Loss report for a date range' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date, defaults to start of current month' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date, defaults to today' })
  getPL(
    @Param('businessId') businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getPLReport(businessId, parseDateRange(from, to));
  }

  @Get('sales')
  @ApiOperation({ summary: 'Sales report for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getSales(
    @Param('businessId') businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getSalesReport(businessId, parseDateRange(from, to));
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Expense report for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getExpenses(
    @Param('businessId') businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getExpenseReport(businessId, parseDateRange(from, to));
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'Cash flow report for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getCashFlow(
    @Param('businessId') businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getCashFlowReport(businessId, parseDateRange(from, to));
  }

  @Get('customers')
  @ApiOperation({ summary: 'Customer receivables report for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getCustomers(
    @Param('businessId') businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getCustomerReport(businessId, parseDateRange(from, to));
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory / stock levels report for a date range' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getInventory(
    @Param('businessId') businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getInventoryReport(businessId, parseDateRange(from, to));
  }
}
