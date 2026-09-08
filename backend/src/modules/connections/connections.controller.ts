import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { ConnectionsService } from './connections.service';

@ApiTags('connections')
@Controller('businesses/:businessId/connections')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List all available integration providers' })
  getProviders() {
    return this.connectionsService.getProviders();
  }

  @Get()
  @ApiOperation({ summary: 'List active connections for this business' })
  list(@Param('businessId') businessId: string) {
    return this.connectionsService.listConnections(businessId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new integration connection' })
  create(
    @Param('businessId') businessId: string,
    @Body() body: { providerId: string },
  ) {
    return this.connectionsService.createConnection(businessId, body.providerId);
  }

  @Get(':connectionId')
  @ApiOperation({ summary: 'Get a specific connection' })
  getOne(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
  ) {
    return this.connectionsService.getConnection(businessId, connectionId);
  }

  @Post(':connectionId/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger a manual sync for a connection' })
  sync(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
  ) {
    return this.connectionsService.triggerSync(businessId, connectionId);
  }

  @Delete(':connectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a connection' })
  remove(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
  ) {
    this.connectionsService.deleteConnection(businessId, connectionId);
  }
}
