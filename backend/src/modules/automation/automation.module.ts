import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { FeatureFlagsService } from './feature-flags.service';

@Module({
  imports: [AuthModule],
  controllers: [AutomationController],
  providers: [AutomationService, FeatureFlagsService],
  exports: [AutomationService, FeatureFlagsService],
})
export class AutomationModule {}
