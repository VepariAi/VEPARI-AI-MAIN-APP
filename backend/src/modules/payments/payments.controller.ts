import {
  Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { PaymentsService, type PaymentDto } from './payments.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('payments')
@Controller('businesses/:businessId/payments')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List payments (PAYMENT, CREDIT_ISSUED, CREDIT_RECEIVED)' })
  list(
    @Param('businessId') businessId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('customerId') customerId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    const opts: { limit?: number; offset?: number; customerId?: string; supplierId?: string } = {};
    if (limit) opts.limit = parseInt(limit, 10);
    if (offset) opts.offset = parseInt(offset, 10);
    if (customerId) opts.customerId = customerId;
    if (supplierId) opts.supplierId = supplierId;
    return this.paymentsService.listPayments(businessId, opts);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a payment' })
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: PaymentDto,
    @Req() req: { ip?: string; user?: { id: string } },
  ) {
    const payment = await this.paymentsService.recordPayment(businessId, dto);
    void this.auditService.log({
      ...(req.user?.id ? { userId: req.user.id } : {}),
      action: 'PAYMENT_CREATED',
      resource: 'payment',
      resourceId: payment.id,
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
    return payment;
  }

  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment detail' })
  getById(
    @Param('businessId') businessId: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.getPaymentById(businessId, paymentId);
  }
}
