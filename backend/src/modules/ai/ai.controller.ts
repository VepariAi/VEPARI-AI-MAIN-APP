import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards, Req, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { AiService, type MemoryCandidate } from './ai.service';
import { MemoryService } from './memory.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';
import { isValidLanguageCode, type LanguageCode } from '@vepari/types';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly usageService: UsageService,
    private readonly auditService: AuditService,
  ) {}

  @Post('memory/extract')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract structured memory candidates from a voice transcript' })
  extractMemoryCandidates(@Body() body: { transcript: string }) {
    return this.aiService.extractMemoryCandidates(body.transcript);
  }
}

@ApiTags('ai')
@Controller('businesses/:businessId/ai')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class AiBusinessController {
  constructor(
    private readonly aiService: AiService,
    private readonly memoryService: MemoryService,
    private readonly usageService: UsageService,
    private readonly auditService: AuditService,
  ) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conversational AI chat grounded in live business data and memory' })
  async chatWithBusiness(
    @Param('businessId') businessId: string,
    @Body() body: { transcript: string },
    @Req() req: { ip?: string; user?: { id: string } },
    @Headers('x-language') xLanguage?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    const rawLang = xLanguage ?? acceptLanguage?.split(',')[0]?.split(';')[0]?.trim();
    const language: LanguageCode = (rawLang && isValidLanguageCode(rawLang)) ? rawLang : 'en';
    const result = await this.aiService.chatWithBusiness(businessId, body.transcript, req.user?.id, language);
    void this.usageService.record({ businessId, type: 'ai_chat' });
    void this.auditService.log({
      ...(req.user?.id ? { userId: req.user.id } : {}),
      action: 'AI_CHAT',
      resource: 'ai',
      resourceId: businessId,
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
    return result;
  }

  @Get('memory')
  @ApiOperation({ summary: 'Get current business memory snapshot (cached, TTL 24h)' })
  getBusinessMemory(@Param('businessId') businessId: string) {
    return this.memoryService.getBusinessMemory(businessId);
  }

  @Post('memory/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force-refresh the business memory snapshot' })
  refreshBusinessMemory(@Param('businessId') businessId: string) {
    return this.memoryService.refreshBusinessMemory(businessId);
  }

  @Post('actions/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply user-approved AI-extracted actions to the database' })
  applyApprovedActions(
    @Param('businessId') businessId: string,
    @Body() body: { candidates: MemoryCandidate[] },
  ) {
    return this.aiService.applyApprovedActions(businessId, body.candidates ?? []);
  }
}
