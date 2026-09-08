import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { SyncService, SyncMutation } from './sync.service';

class SyncBatchBody {
  mutations!: SyncMutation[];
}

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@Controller('businesses/:businessId/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('mutations')
  applyMutations(
    @Param('businessId') businessId: string,
    @Body() body: SyncBatchBody,
  ) {
    return this.syncService.applyMutations(businessId, body.mutations);
  }
}
