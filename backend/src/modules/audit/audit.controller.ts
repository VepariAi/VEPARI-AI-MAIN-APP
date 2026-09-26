import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List recent audit log entries (admin)' })
  findAll(@Query('limit') limit?: string) {
    return this.auditService.findAll(limit ? Number(limit) : 100);
  }

  @Get('by-resource')
  @ApiOperation({ summary: 'Get audit logs for a specific resource type' })
  byResource(
    @Query('resource') resource: string,
    @Query('resourceId') resourceId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findByResource(resource, resourceId, limit ? Number(limit) : 50);
  }
}
