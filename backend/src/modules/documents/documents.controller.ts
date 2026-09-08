import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentsService, type CreateDocumentDto } from './documents.service';

@ApiTags('documents')
@Controller('businesses/:businessId/documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a document record' })
  create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.create(businessId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List documents, optionally filtered by type' })
  list(
    @Param('businessId') businessId: string,
    @Query('type') type?: string,
  ) {
    return this.documentsService.list(businessId, type);
  }

  @Get(':documentId')
  @ApiOperation({ summary: 'Get a document by ID' })
  getById(
    @Param('businessId') businessId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentsService.getById(businessId, documentId);
  }

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document record' })
  delete(
    @Param('businessId') businessId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentsService.delete(businessId, documentId);
  }
}
