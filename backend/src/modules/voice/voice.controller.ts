import { Controller, Get } from '@nestjs/common';
import { VoiceService } from './voice.service';

@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get()
  findAll() {
    return this.voiceService.findAll();
  }
}
