import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';

@ApiTags('notifications')
@Controller('businesses/:businessId/alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Evaluate and return active loss/anomaly alerts (with cooldown dedup)' })
  evaluate(@Param('businessId') businessId: string) {
    return this.alertsService.evaluateAlerts(businessId);
  }
}
