import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { BriefingService } from './briefing.service';

@Module({
  controllers: [AiController],
  providers: [AiService, BriefingService],
  exports: [AiService, BriefingService],
})
export class AiModule {}
