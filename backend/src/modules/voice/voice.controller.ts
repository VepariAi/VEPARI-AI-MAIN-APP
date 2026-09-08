import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoiceService } from './voice.service';
import type { SupportedLanguage } from './voice.service';
import { UsageService } from '../usage/usage.service';

@ApiTags('voice')
@Controller('voice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceController {
  constructor(
    private readonly voiceService: VoiceService,
    private readonly usageService: UsageService,
  ) {}

  @Post('stt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transcribe audio using Sarvam Saaras (server-side only)' })
  async transcribe(
    @Body() body: { audioBase64: string; languageCode?: string; businessId?: string },
  ) {
    const result = await this.voiceService.transcribe(body.audioBase64, body.languageCode);
    if (body.businessId) {
      this.usageService.record({ businessId: body.businessId, type: 'stt' });
    }
    return result;
  }

  @Post('tts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synthesise speech using Sarvam Bulbul (server-side only)' })
  async synthesise(
    @Body() body: { text: string; languageCode?: SupportedLanguage; businessId?: string },
  ) {
    const result = await this.voiceService.synthesise(body.text, body.languageCode);
    if (body.businessId) {
      this.usageService.record({ businessId: body.businessId, type: 'tts' });
    }
    return result;
  }
}
