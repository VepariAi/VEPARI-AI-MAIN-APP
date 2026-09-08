import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AutomationService, type CreateRuleDto } from './automation.service';

@ApiTags('automation')
@Controller('businesses/:businessId/automation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get()
  @ApiOperation({ summary: 'List automation rules for a business' })
  findAll(@Param('businessId') businessId: string) {
    return this.automationService.findAll(businessId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an automation rule' })
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateRuleDto,
  ) {
    return this.automationService.create(businessId, dto);
  }

  @Get(':ruleId')
  @ApiOperation({ summary: 'Get an automation rule by ID' })
  getById(
    @Param('businessId') businessId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.automationService.getById(businessId, ruleId);
  }

  @Patch(':ruleId')
  @ApiOperation({ summary: 'Update an automation rule' })
  update(
    @Param('businessId') businessId: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: Partial<CreateRuleDto> & { isActive?: boolean },
  ) {
    return this.automationService.update(businessId, ruleId, dto);
  }

  @Delete(':ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an automation rule' })
  delete(
    @Param('businessId') businessId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.automationService.delete(businessId, ruleId);
  }
}
