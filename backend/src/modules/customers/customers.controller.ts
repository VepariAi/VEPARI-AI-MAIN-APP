import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { CustomersService, type CustomerDto, type CreditAdjustmentDto } from './customers.service';

@ApiTags('customers')
@Controller('businesses/:businessId/customers')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a customer' })
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CustomerDto,
  ) {
    return this.customersService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customers with credit balances' })
  list(@Param('businessId') businessId: string) {
    return this.customersService.list(businessId);
  }

  @Get('top-debtors')
  @ApiOperation({ summary: 'Customers with highest outstanding credit' })
  topDebtors(@Param('businessId') businessId: string) {
    return this.customersService.getTopDebtors(businessId);
  }

  @Get('total-receivable')
  @ApiOperation({ summary: 'Total amount owed by all customers (paise)' })
  totalReceivable(@Param('businessId') businessId: string) {
    return this.customersService.getTotalReceivable(businessId);
  }

  @Get(':customerId')
  @ApiOperation({ summary: 'Get a customer with credit balance' })
  getById(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.getById(businessId, customerId);
  }

  @Patch(':customerId')
  @ApiOperation({ summary: 'Update customer details' })
  update(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: Partial<CustomerDto>,
  ) {
    return this.customersService.update(businessId, customerId, dto);
  }

  @Patch(':customerId/credit')
  @ApiOperation({ summary: 'Adjust customer credit balance (paise)' })
  adjustCredit(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Body() dto: CreditAdjustmentDto,
  ) {
    return this.customersService.adjustCredit(businessId, customerId, dto);
  }

  @Get(':customerId/history')
  @ApiOperation({ summary: 'Full transaction history for a customer' })
  getHistory(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.getHistory(businessId, customerId, limit ? parseInt(limit, 10) : 50);
  }

  @Delete(':customerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate (soft-delete) a customer' })
  deactivate(
    @Param('businessId') businessId: string,
    @Param('customerId') customerId: string,
  ) {
    return this.customersService.deactivate(businessId, customerId);
  }
}
