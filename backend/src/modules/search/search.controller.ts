import { Controller, Get, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessMemberGuard } from '../auth/guards/business-member.guard';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
@Controller('businesses/:businessId/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search customers, suppliers, products, sales and expenses' })
  @ApiQuery({ name: 'q', description: 'Search query (min 2 characters)' })
  search(
    @Param('businessId') businessId: string,
    @Query('q') q?: string,
  ) {
    if (!q || q.trim().length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }
    return this.searchService.search(businessId, q);
  }
}
