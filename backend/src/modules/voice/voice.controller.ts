import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoiceService } from './voice.service';
import type { SupportedLanguage } from './voice.service';

@ApiTags('voice')
@Controller('voice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('stt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transcribe audio using Sarvam Saaras (server-side only)' })
  transcribe(
    @Body() body: { audioBase64: string; languageCode?: string },
  ) {
    return this.voiceService.transcribe(body.audioBase64, body.languageCode);
  }

  @Post('tts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synthesise speech using Sarvam Bulbul (server-side only)' })
  synthesise(
    @Body() body: { text: string; languageCode?: SupportedLanguage },
  ) {
    return this.voiceService.synthesise(body.text, body.languageCode);
  }
}
