import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsageService } from './usage.service';

@ApiTags('usage')
@Controller('businesses/:businessId/usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  @ApiOperation({ summary: 'Get current-month usage counters for this business' })
  getUsage(@Param('businessId') businessId: string) {
    return this.usageService.getUsage(businessId);
  }
}
