import {
  Controller, Get, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { AlertsService } from './alerts.service';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('businesses/:businessId')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Evaluate and return active loss/anomaly alerts (with cooldown dedup)' })
  evaluateAlerts(@Param('businessId') businessId: string) {
    return this.alertsService.evaluateAlerts(businessId);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List in-app notifications' })
  listNotifications(
    @Param('businessId') businessId: string,
    @Query('unread') unread?: string,
  ) {
    return this.notificationsService.list(businessId, unread === 'true');
  }

  @Get('notifications/unread-count')
  @ApiOperation({ summary: 'Count of unread notifications' })
  unreadCount(@Param('businessId') businessId: string) {
    return { count: this.notificationsService.unreadCount(businessId) };
  }

  @Patch('notifications/:notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @Param('businessId') businessId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return { marked: this.notificationsService.markRead(businessId, notificationId) };
  }

  @Patch('notifications/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@Param('businessId') businessId: string) {
    return { marked: this.notificationsService.markAllRead(businessId) };
  }

  @Delete('notifications/:notificationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss (delete) a notification' })
  dismiss(
    @Param('businessId') businessId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return { dismissed: this.notificationsService.dismiss(businessId, notificationId) };
  }
}
