import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conversational AI chat grounded in live business data' })
  chatWithBusiness(@Body() body: { businessId: string; transcript: string }) {
    return this.aiService.chatWithBusiness(body.businessId, body.transcript);
  }

  @Post('memory/extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract structured memory candidates from a voice transcript' })
  extractMemoryCandidates(@Body() body: { transcript: string }) {
    return this.aiService.extractMemoryCandidates(body.transcript);
  }
}
