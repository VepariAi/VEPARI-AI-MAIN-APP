import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { BriefingService } from './briefing.service';
import { UsageModule } from '../usage/usage.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [UsageModule, AuditModule],
  controllers: [AiController],
  providers: [AiService, BriefingService],
  exports: [AiService, BriefingService],
})
export class AiModule {}
