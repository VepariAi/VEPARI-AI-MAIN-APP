import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OtpPurpose } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() body: { phone: string; purpose: OtpPurpose }): Promise<{ message: string }> {
    return this.authService.sendOtp(body.phone, body.purpose);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user with OTP verification' })
  register(
    @Body() body: { phone: string; code: string; name: string },
  ) {
    return this.authService.verifyOtpAndRegister(body.phone, body.code, body.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with OTP verification' })
  login(@Body() body: { phone: string; code: string }) {
    return this.authService.verifyOtpAndLogin(body.phone, body.code);
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(@Body() body: { refreshToken: string }) {
    return this.authService.revokeRefreshToken(body.refreshToken);
  }
}
