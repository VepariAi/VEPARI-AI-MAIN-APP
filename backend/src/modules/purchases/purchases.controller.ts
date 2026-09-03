import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchasesService, CreatePurchaseDto } from './purchases.service';

@ApiTags('purchases')
@Controller('businesses/:businessId/purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a purchase from a supplier (stock-in, atomic)' })
  create(@Param('businessId') businessId: string, @Body() body: Omit<CreatePurchaseDto, 'businessId'>) {
    return this.purchasesService.createPurchase({ ...body, businessId });
  }

  @Get()
  @ApiOperation({ summary: 'List purchases for a business' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  list(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.purchasesService.listPurchases(
      businessId,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
      supplierId,
    );
  }

  @Get(':purchaseId')
  @ApiOperation({ summary: 'Get a single purchase with line items' })
  getOne(
    @Param('businessId') businessId: string,
    @Param('purchaseId') purchaseId: string,
  ) {
    return this.purchasesService.getPurchaseById(businessId, purchaseId);
  }
}
