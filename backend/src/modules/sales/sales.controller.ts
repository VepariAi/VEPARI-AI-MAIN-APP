import {
  Controller, Get, Post, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { SalesService, type CreateSaleDto } from './sales.service';

@ApiTags('sales')
@Controller('businesses/:businessId/sales')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a sale (confirm-before-save from mobile)' })
  create(
    @Param('businessId') businessId: string,
    @Body() body: Omit<CreateSaleDto, 'businessId'>,
  ) {
    return this.salesService.createSale({ ...body, businessId });
  }

  @Get()
  @ApiOperation({ summary: 'List sales for a business' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  list(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('customerId') customerId?: string,
  ) {
    return this.salesService.listSales(
      businessId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
      customerId,
    );
  }

  @Get('today-total')
  @ApiOperation({ summary: 'Get total sales amount for today (in paise)' })
  todayTotal(@Param('businessId') businessId: string) {
    return this.salesService.getSalesTodayTotal(businessId);
  }

  @Get(':saleId')
  @ApiOperation({ summary: 'Get a single sale with line items' })
  getOne(
    @Param('businessId') businessId: string,
    @Param('saleId') saleId: string,
  ) {
    return this.salesService.getSaleById(businessId, saleId);
  }
}
