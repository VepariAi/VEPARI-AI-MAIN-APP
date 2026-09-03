import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AlertsService } from './alerts.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, AlertsService],
  exports: [NotificationsService, AlertsService],
})
export class NotificationsModule {}
