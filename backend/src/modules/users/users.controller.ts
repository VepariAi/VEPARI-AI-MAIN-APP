import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthRequest {
  user: { id: string; phone: string };
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@Request() req: AuthRequest) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(
    @Request() req: AuthRequest,
    @Body() body: { name?: string; language?: string },
  ) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
