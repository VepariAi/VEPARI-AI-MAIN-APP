import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService, type StockMovementDto, type StockAdjustmentDto } from './inventory.service';

@ApiTags('inventory')
@Controller('businesses/:businessId/inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all products with current stock levels' })
  listProducts(@Param('businessId') businessId: string) {
    return this.inventoryService.listProducts(businessId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Products at or below low-stock threshold' })
  getLowStock(@Param('businessId') businessId: string) {
    return this.inventoryService.getLowStockProducts(businessId);
  }

  @Get('value')
  @ApiOperation({ summary: 'Total inventory value at cost and selling price (paise)' })
  getInventoryValue(@Param('businessId') businessId: string) {
    return this.inventoryService.getInventoryValue(businessId);
  }

  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a stock movement (in/out/adjustment)' })
  recordMovement(
    @Param('businessId') businessId: string,
    @Body() dto: StockMovementDto,
  ) {
    return this.inventoryService.recordMovement(businessId, dto);
  }

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set absolute stock count for a product (creates ADJUSTMENT movement)' })
  adjustStock(
    @Param('businessId') businessId: string,
    @Body() dto: StockAdjustmentDto,
  ) {
    return this.inventoryService.adjustStock(businessId, dto);
  }

  @Get('products/:productId/movements')
  @ApiOperation({ summary: 'Stock movement history for a product' })
  getMovementHistory(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getMovementHistory(businessId, productId, limit ? parseInt(limit, 10) : 50);
  }
}
