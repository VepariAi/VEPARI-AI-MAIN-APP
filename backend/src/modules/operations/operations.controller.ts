import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OperationsService, CreateOperationDto, OperationStatus } from './operations.service';

@ApiTags('operations')
@Controller('businesses/:businessId/operations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  @ApiOperation({ summary: 'List operations (orders, tasks, etc.)' })
  findAll(
    @Param('businessId') businessId: string,
    @Query('status') status?: OperationStatus,
  ) {
    return this.operationsService.findAll(businessId, status);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new operation' })
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateOperationDto,
  ) {
    return this.operationsService.create(businessId, dto);
  }

  @Get(':operationId')
  @ApiOperation({ summary: 'Get a single operation' })
  getById(
    @Param('businessId') businessId: string,
    @Param('operationId') operationId: string,
  ) {
    return this.operationsService.getById(businessId, operationId);
  }

  @Patch(':operationId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update operation status' })
  updateStatus(
    @Param('businessId') businessId: string,
    @Param('operationId') operationId: string,
    @Body('status') status: OperationStatus,
  ) {
    return this.operationsService.updateStatus(businessId, operationId, status);
  }

  @Patch(':operationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update operation fields' })
  update(
    @Param('businessId') businessId: string,
    @Param('operationId') operationId: string,
    @Body() dto: Partial<CreateOperationDto>,
  ) {
    return this.operationsService.update(businessId, operationId, dto);
  }
}
