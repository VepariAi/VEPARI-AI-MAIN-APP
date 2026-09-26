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

  @Post(':connectionId/credentials')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Store integration credentials (encrypted at rest in MySQL)' })
  setCredentials(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
    @Body() body: { credentials: Record<string, string> },
  ) {
    return this.connectionsService.setCredentials(businessId, connectionId, body.credentials ?? {});
  }

  @Get(':connectionId/health')
  @ApiOperation({ summary: 'Check the live health of a connection via its adapter' })
  async health(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
  ) {
    const conn = await this.connectionsService.getConnection(businessId, connectionId);
    const credentials = await this.connectionsService.getDecryptedCredentials(businessId, connectionId);
    return this.syncService.checkHealth(conn.providerId, connectionId, credentials);
  }

  @Post(':connectionId/oauth/authorize-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Build the provider OAuth authorize URL for this connection' })
  async authorizeUrl(
    @Param('businessId') businessId: string,
    @Param('connectionId') connectionId: string,
    @Body() body: { clientId: string; authorizeEndpoint: string; redirectUri: string; scopes: string[] },
  ) {
    const conn = await this.connectionsService.getConnection(businessId, connectionId);
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
