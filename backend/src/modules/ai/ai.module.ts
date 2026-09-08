import { Module } from '@nestjs/common';
import { AiController, AiBusinessController } from './ai.controller';
import { AiService } from './ai.service';
import { BriefingService } from './briefing.service';
import { MemoryService } from './memory.service';
import { UsageModule } from '../usage/usage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsageModule, AuditModule, AuthModule],
  controllers: [AiController, AiBusinessController],
  providers: [AiService, BriefingService, MemoryService],
  exports: [AiService, BriefingService, MemoryService],
})
export class AiModule {}
