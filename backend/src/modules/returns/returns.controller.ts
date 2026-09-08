import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReturnsService, CreateReturnDto, ReturnStatus, ReturnType } from './returns.service';

@ApiTags('returns')
@Controller('businesses/:businessId/returns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  @ApiOperation({ summary: 'List returns/refunds' })
  findAll(
    @Param('businessId') businessId: string,
    @Query('status') status?: ReturnStatus,
    @Query('type') type?: ReturnType,
  ) {
    return this.returnsService.findAll(businessId, status, type);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Returns summary (counts and total refunded)' })
  summary(@Param('businessId') businessId: string) {
    return this.returnsService.getSummary(businessId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a return request' })
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.returnsService.create(businessId, dto);
  }

  @Get(':returnId')
  @ApiOperation({ summary: 'Get a return by ID' })
  getById(
    @Param('businessId') businessId: string,
    @Param('returnId') returnId: string,
  ) {
    return this.returnsService.getById(businessId, returnId);
  }

  @Patch(':returnId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update return status (APPROVED / REJECTED / REFUNDED)' })
  updateStatus(
    @Param('businessId') businessId: string,
    @Param('returnId') returnId: string,
    @Body('status') status: ReturnStatus,
  ) {
    return this.returnsService.updateStatus(businessId, returnId, status);
  }
}
