import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { ConnectionsService } from './connections.service';
import { ConnectionSyncService } from './connection-sync.service';
import { OAuthFlowService } from './oauth-flow.service';

@ApiTags('connections')
@Controller('businesses/:businessId/connections')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@ApiBearerAuth()
export class ConnectionsController {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly syncService: ConnectionSyncService,
    private readonly oauthFlow: OAuthFlowService,
  ) {}

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

  @Get(':connectionId/health')
  @ApiOperation({ summary: 'Check the live health of a connection via its adapter' })
  health(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
  ) {
    const conn = this.connectionsService.getConnection(businessId, connectionId);
    // Credentials would be loaded from the secret store keyed by connection.
    return this.syncService.checkHealth(conn.providerId, connectionId, {});
  }

  @Post(':connectionId/oauth/authorize-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build the provider OAuth authorize URL for this connection' })
  authorizeUrl(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
    @Body() body: { clientId: string; authorizeEndpoint: string; redirectUri: string; scopes: string[] },
  ) {
    const conn = this.connectionsService.getConnection(businessId, connectionId);
    return this.oauthFlow.buildAuthorizeUrl({
      providerId: conn.providerId,
      businessId,
      connectionId,
      clientId: body.clientId,
      authorizeEndpoint: body.authorizeEndpoint,
      redirectUri: body.redirectUri,
      scopes: body.scopes ?? [],
    });
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
