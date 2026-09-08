import { Controller, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { AiService } from './ai.service';
import { UsageService } from '../usage/usage.service';
import { AuditService } from '../audit/audit.service';

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
    private readonly usageService: UsageService,
    private readonly auditService: AuditService,
  ) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conversational AI chat grounded in live business data' })
  async chatWithBusiness(
    @Param('businessId') businessId: string,
    @Body() body: { transcript: string },
    @Req() req: { ip?: string; user?: { id: string } },
  ) {
    const result = await this.aiService.chatWithBusiness(businessId, body.transcript);
    this.usageService.record({ businessId, type: 'ai_chat' });
    void this.auditService.log({
      ...(req.user?.id ? { userId: req.user.id } : {}),
      action: 'AI_CHAT',
      resource: 'ai',
      resourceId: businessId,
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
    return result;
  }
}
