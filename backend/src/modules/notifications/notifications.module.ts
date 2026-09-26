import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AlertsService } from './alerts.service';
import { NotificationsListener } from './notifications.listener';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, AlertsService, NotificationsListener],
  exports: [NotificationsService, AlertsService],
})
export class NotificationsModule {}
