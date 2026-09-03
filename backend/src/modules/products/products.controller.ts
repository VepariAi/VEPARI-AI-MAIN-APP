import {
  Controller, Get, Post, Patch, Body, Param, Query,
  UseGuards, ParseBoolPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService, CreateProductDto, UpdateProductDto } from './products.service';

class CreateProductBody {
  name!: string;
  sku?: string;
  priceInPaise!: number;
  costPriceInPaise?: number;
  stock?: number;
  unit?: string;
  lowStockThreshold?: number;
}

class AdjustStockBody {
  adjustment!: number;
}

class UpdateProductBody {
  name?: string;
  sku?: string | null;
  priceInPaise?: number;
  costPriceInPaise?: number;
  unit?: string;
  lowStockThreshold?: number | null;
  isActive?: boolean;
}

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses/:businessId/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  createProduct(
    @Param('businessId') businessId: string,
    @Body() body: CreateProductBody,
  ) {
    const dto: CreateProductDto = { businessId, name: body.name, priceInPaise: body.priceInPaise };
    if (body.sku !== undefined) dto.sku = body.sku;
    if (body.costPriceInPaise !== undefined) dto.costPriceInPaise = body.costPriceInPaise;
    if (body.stock !== undefined) dto.stock = body.stock;
    if (body.unit !== undefined) dto.unit = body.unit;
    if (body.lowStockThreshold !== undefined) dto.lowStockThreshold = body.lowStockThreshold;
    return this.productsService.createProduct(dto);
  }

  @Get()
  listProducts(
    @Param('businessId') businessId: string,
    @Query('activeOnly', new DefaultValuePipe(true), ParseBoolPipe) activeOnly: boolean,
  ) {
    return this.productsService.listProducts(businessId, activeOnly);
  }

  @Get('low-stock')
  getLowStock(@Param('businessId') businessId: string) {
    return this.productsService.getLowStockProducts(businessId);
  }

  @Get(':productId')
  getProduct(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
  ) {
    return this.productsService.getProductById(businessId, productId);
  }

  @Patch(':productId')
  updateProduct(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() body: UpdateProductBody,
  ) {
    const dto: UpdateProductDto = {};
    if (body.name !== undefined) dto.name = body.name;
    if (body.sku !== undefined) dto.sku = body.sku;
    if (body.priceInPaise !== undefined) dto.priceInPaise = body.priceInPaise;
    if (body.costPriceInPaise !== undefined) dto.costPriceInPaise = body.costPriceInPaise;
    if (body.unit !== undefined) dto.unit = body.unit;
    if (body.lowStockThreshold !== undefined) dto.lowStockThreshold = body.lowStockThreshold;
    if (body.isActive !== undefined) dto.isActive = body.isActive;
    return this.productsService.updateProduct(businessId, productId, dto);
  }

  @Patch(':productId/stock')
  adjustStock(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() body: AdjustStockBody,
  ) {
    return this.productsService.adjustStock(businessId, productId, body.adjustment);
  }
}
