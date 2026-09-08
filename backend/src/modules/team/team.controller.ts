import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { UserRole } from '@prisma/client';

interface AuthRequest {
  user: { id: string; phone: string };
}

@ApiTags('team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@Controller('businesses/:businessId/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'List all team members for a business' })
  listMembers(@Param('businessId') businessId: string) {
    return this.teamService.listMembers(businessId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Add a team member by phone number' })
  invite(
    @Param('businessId') businessId: string,
    @Request() req: AuthRequest,
    @Body() body: { phone: string; role?: UserRole },
  ) {
    return this.teamService.inviteMember(businessId, req.user.id, body.phone, body.role);
  }

  @Patch(':memberId/role')
  @ApiOperation({ summary: 'Update a team member role (owner only)' })
  updateRole(
    @Param('businessId') businessId: string,
    @Param('memberId') memberId: string,
    @Request() req: AuthRequest,
    @Body() body: { role: UserRole },
  ) {
    return this.teamService.updateRole(businessId, req.user.id, memberId, body.role);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Remove a team member' })
  removeMember(
    @Param('businessId') businessId: string,
    @Param('memberId') memberId: string,
    @Request() req: AuthRequest,
  ) {
    return this.teamService.removeMember(businessId, req.user.id, memberId);
  }
}
