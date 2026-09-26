import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { SuppliersService, type SupplierDto, type PayableAdjustmentDto } from './suppliers.service';

@ApiTags('suppliers')
@Controller('businesses/:businessId/suppliers')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a supplier' })
  create(
    @Param('businessId') businessId: string,
    @Body() dto: SupplierDto,
  ) {
    return this.suppliersService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers with payable balances' })
  list(@Param('businessId') businessId: string) {
    return this.suppliersService.list(businessId);
  }

  @Get('top-creditors')
  @ApiOperation({ summary: 'Suppliers with highest outstanding payable' })
  topCreditors(@Param('businessId') businessId: string) {
    return this.suppliersService.getTopCreditors(businessId);
  }

  @Get('total-payable')
  @ApiOperation({ summary: 'Total amount owed to all suppliers (paise)' })
  totalPayable(@Param('businessId') businessId: string) {
    return this.suppliersService.getTotalPayable(businessId);
  }

  @Get(':supplierId')
  @ApiOperation({ summary: 'Get a supplier with payable balance' })
  getById(
    @Param('businessId') businessId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.suppliersService.getById(businessId, supplierId);
  }

  @Patch(':supplierId')
  @ApiOperation({ summary: 'Update supplier details' })
  update(
    @Param('businessId') businessId: string,
    @Param('supplierId') supplierId: string,
    @Body() dto: Partial<SupplierDto>,
  ) {
    return this.suppliersService.update(businessId, supplierId, dto);
  }

  @Patch(':supplierId/payable')
  @ApiOperation({ summary: 'Adjust supplier payable balance (paise)' })
  adjustPayable(
    @Param('businessId') businessId: string,
    @Param('supplierId') supplierId: string,
    @Body() dto: PayableAdjustmentDto,
  ) {
    return this.suppliersService.adjustPayable(businessId, supplierId, dto);
  }

  @Get(':supplierId/history')
  @ApiOperation({ summary: 'Full purchase history for a supplier' })
  getHistory(
    @Param('businessId') businessId: string,
    @Param('supplierId') supplierId: string,
    @Query('limit') limit?: string,
  ) {
    return this.suppliersService.getHistory(businessId, supplierId, limit ? parseInt(limit, 10) : 50);
  }

  @Delete(':supplierId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate (soft-delete) a supplier' })
  deactivate(
    @Param('businessId') businessId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.suppliersService.deactivate(businessId, supplierId);
  }
}
