import { Module } from '@nestjs/common';
import { VoiceController } from './voice.controller';
import { VoiceService } from './voice.service';
import { TransliterationService } from './transliteration.service';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [UsageModule],
  controllers: [VoiceController],
  providers: [VoiceService, TransliterationService],
  exports: [VoiceService, TransliterationService],
})
export class VoiceModule {}
