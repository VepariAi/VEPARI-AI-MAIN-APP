import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { PurchasesService, CreatePurchaseDto } from './purchases.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('purchases')
@Controller('businesses/:businessId/purchases')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class PurchasesController {
  constructor(
    private readonly purchasesService: PurchasesService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a purchase from a supplier (stock-in, atomic)' })
  async create(
    @Param('businessId') businessId: string,
    @Body() body: Omit<CreatePurchaseDto, 'businessId'>,
    @Req() req: { ip?: string; user?: { id: string } },
  ) {
    const purchase = await this.purchasesService.createPurchase({ ...body, businessId });
    void this.auditService.log({
      ...(req.user?.id ? { userId: req.user.id } : {}),
      action: 'PURCHASE_CREATED',
      resource: 'purchase',
      resourceId: purchase.id,
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
    return purchase;
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
