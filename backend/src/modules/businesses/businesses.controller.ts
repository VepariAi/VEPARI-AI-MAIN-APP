import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessType } from '@prisma/client';

interface AuthRequest {
  user: { id: string; phone: string };
}

@ApiTags('businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new business' })
  create(
    @Request() req: AuthRequest,
    @Body() body: { name: string; type?: BusinessType; phone: string; gstNumber?: string },
  ) {
    return this.businessesService.create(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all businesses for current user' })
  findAll(@Request() req: AuthRequest) {
    return this.businessesService.findByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get business by ID' })
  findOne(@Param('id') id: string) {
    return this.businessesService.findById(id);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get business dashboard summary' })
  getDashboard(@Param('id') id: string) {
    return this.businessesService.getDashboardSummary(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update business details' })
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.businessesService.update(id, req.user.id, body as Parameters<typeof this.businessesService.update>[2]);
  }
}
