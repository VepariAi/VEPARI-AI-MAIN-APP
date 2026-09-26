// Privacy controls API — PROMPT 207.
//
// Endpoints operate only on the authenticated caller's own account; the user id
// comes from the verified JWT, never from a request parameter, so one user can
// never export or erase another's data.

import { Controller, Get, Delete, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrivacyService } from './privacy.service';

interface AuthedRequest {
  user: { id: string; phone: string };
}

@ApiTags('privacy')
@Controller('privacy')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all personal data held for the authenticated user' })
  export(@Req() req: AuthedRequest) {
    return this.privacy.exportUserData(req.user.id);
  }

  @Get('retention')
  @ApiOperation({ summary: 'Get the data retention policy' })
  retention() {
    return { policy: this.privacy.getRetentionPolicy() };
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Erase the authenticated user (right to erasure)' })
  erase(@Req() req: AuthedRequest) {
    return this.privacy.eraseUser(req.user.id);
  }
}
