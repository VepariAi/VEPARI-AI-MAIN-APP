import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AlertsService } from './alerts.service';
import { NotificationsListener } from './notifications.listener';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, AlertsService, NotificationsListener],
  exports: [NotificationsService, AlertsService],
})
export class NotificationsModule {}
