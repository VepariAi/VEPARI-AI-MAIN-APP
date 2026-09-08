import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OtpPurpose } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

type AuthReq = { ip?: string; user?: { id: string } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  sendOtp(@Body() body: { phone: string; purpose: OtpPurpose }): Promise<{ message: string }> {
    return this.authService.sendOtp(body.phone, body.purpose);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user with OTP verification' })
  async register(
    @Body() body: { phone: string; code: string; name: string },
    @Req() req: AuthReq,
  ) {
    const result = await this.authService.verifyOtpAndRegister(body.phone, body.code, body.name);
    void this.auditService.log({
      userId: result.user.id,
      action: 'REGISTER',
      resource: 'auth',
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with OTP verification' })
  async login(
    @Body() body: { phone: string; code: string },
    @Req() req: AuthReq,
  ) {
    const result = await this.authService.verifyOtpAndLogin(body.phone, body.code);
    void this.auditService.log({
      userId: result.user.id,
      action: 'LOGIN',
      resource: 'auth',
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
    return result;
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
  async logout(
    @Body() body: { refreshToken: string },
    @Req() req: AuthReq,
  ) {
    await this.authService.revokeRefreshToken(body.refreshToken);
    void this.auditService.log({
      ...(req.user?.id ? { userId: req.user.id } : {}),
      action: 'LOGOUT',
      resource: 'auth',
      ...(req.ip ? { ipAddress: req.ip } : {}),
    }).catch(() => undefined);
  }
}
