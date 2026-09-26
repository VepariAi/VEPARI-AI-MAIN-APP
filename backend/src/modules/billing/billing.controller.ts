import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { BillingService, type PlanId, type BillingCycle } from './billing.service';

@ApiTags('billing')
@Controller('businesses/:businessId/billing')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all available subscription plans' })
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription status' })
  getSubscription(@Param('businessId') businessId: string) {
    return this.billingService.getSubscription(businessId);
  }

  @Post('subscription')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change subscription plan' })
  changePlan(
    @Param('businessId') businessId: string,
    @Body() body: { planId: PlanId; billingCycle: BillingCycle },
  ) {
    return this.billingService.changePlan(businessId, body.planId, body.billingCycle);
  }

  @Patch('subscription/cancel')
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  cancel(@Param('businessId') businessId: string) {
    return this.billingService.cancelSubscription(businessId);
  }

  @Patch('subscription/reactivate')
  @ApiOperation({ summary: 'Reactivate a cancelled subscription' })
  reactivate(@Param('businessId') businessId: string) {
    return this.billingService.reactivateSubscription(businessId);
  }
}
