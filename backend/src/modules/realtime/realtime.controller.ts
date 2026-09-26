import { Controller, Param, Sse, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { RealtimeService, RealtimeEvent } from './realtime.service';

@ApiTags('realtime')
@Controller('businesses/:businessId/events')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('stream')
  @ApiOperation({ summary: 'SSE stream of domain events for this business' })
  stream(
    @Param('businessId') businessId: string,
  ): Observable<{ data: RealtimeEvent }> {
    return this.realtimeService.streamForBusiness(businessId);
  }
}
