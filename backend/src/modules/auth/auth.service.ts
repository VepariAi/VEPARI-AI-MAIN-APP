import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';
import * as crypto from 'crypto';

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 3;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;       // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 90;

interface JwtPayload {
  sub: string;
  phone: string;
  businessId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(phone: string, purpose: OtpPurpose): Promise<{ message: string }> {
    // Validate Indian mobile number (10 digits, starts 6-9)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('Invalid Indian mobile number');
    }

    if (purpose === OtpPurpose.REGISTER) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      if (existing) {
        throw new ConflictException('Phone number already registered');
      }
    } else if (purpose === OtpPurpose.LOGIN) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      if (!existing) {
        throw new UnauthorizedException('Phone number not registered');
      }
    }

    // Invalidate previous unused OTPs for this phone+purpose
    await this.prisma.otpCode.updateMany({
      where: { phone, purpose, usedAt: null },
      data: { usedAt: new Date() },
    });

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { phone, code, purpose, expiresAt },
    });

    // In production, send via SMS gateway (Sarvam/Twilio/AWS SNS)
    // NEVER log the OTP in production
    if (process.env['NODE_ENV'] !== 'production') {
      console.log(`[DEV ONLY] OTP for ${phone}: ${code}`);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyOtpAndRegister(
    phone: string,
    code: string,
    name: string,
  ): Promise<{ user: { id: string; phone: string; name: string }; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }> {
    await this.verifyOtp(phone, code, OtpPurpose.REGISTER);

    const user = await this.prisma.user.create({
      data: { phone, name },
    });

    const tokens = await this.issueTokens(user.id, user.phone);
    return { user: { id: user.id, phone: user.phone, name: user.name }, tokens };
  }

  async verifyOtpAndLogin(
    phone: string,
    code: string,
  ): Promise<{ user: { id: string; phone: string; name: string }; tokens: { accessToken: string; refreshToken: string; expiresIn: number } }> {
    await this.verifyOtp(phone, code, OtpPurpose.LOGIN);

    const user = await this.prisma.user.findUniqueOrThrow({ where: { phone } });
    const tokens = await this.issueTokens(user.id, user.phone);
    return { user: { id: user.id, phone: user.phone, name: user.name }, tokens };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    return this.issueTokens(user.id, user.phone);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateJwtPayload(payload: JwtPayload): Promise<{ id: string; phone: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      select: { id: true, phone: true },
    });
    return user;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async verifyOtp(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException('OTP not found or already used');
    }

    if (otp.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP has expired');
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many incorrect attempts. Request a new OTP');
    }

    if (otp.code !== code) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    phone: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const payload: JwtPayload = { sub: userId, phone };
    const accessToken = this.jwt.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
