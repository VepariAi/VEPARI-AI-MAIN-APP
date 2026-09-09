import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { SyncService, SyncMutation } from './sync.service';

class SyncBatchBody {
  deviceId!: string;
  mutations!: SyncMutation[];
}

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@Controller('businesses/:businessId/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  /** Push offline mutations — idempotent; duplicate IDs are silently accepted. */
  @Post('mutations')
  applyMutations(
    @Param('businessId') businessId: string,
    @Body() body: SyncBatchBody,
  ) {
    const deviceId = body.deviceId ?? 'default';
    return this.syncService.applyMutations(businessId, deviceId, body.mutations);
  }

  /** Pull server-side changes since a cursor (epoch ms). */
  @Get('pull')
  pullChanges(
    @Param('businessId') businessId: string,
    @Query('since') since: string,
  ) {
    const sinceMs = since ? Number(since) : 0;
    return this.syncService.pullChanges(businessId, sinceMs);
  }
}
