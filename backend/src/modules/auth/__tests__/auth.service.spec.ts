// Unit tests for AuthService — validates OTP flows, token issuance, rotation, and revocation.
// JwtService, ConfigService, and PrismaService are mocked; no DB or JWT infra required.

import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';
import { AuthService } from '../auth.service';

type MockPrisma = {
  user: { findUnique: jest.Mock; findUniqueOrThrow: jest.Mock; create: jest.Mock };
  otpCode: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  refreshToken: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

type MockJwt = { sign: jest.Mock };
type MockConfig = { get: jest.Mock };

function makeMockPrisma(): MockPrisma {
  return {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
    },
    otpCode: {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function makeFakeOtp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'otp1',
    phone: '9876543210',
    code: '123456',
    purpose: OtpPurpose.LOGIN,
    attempts: 0,
    usedAt: null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
    createdAt: new Date(),
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrisma;
  let jwtSvc: MockJwt;

  beforeEach(() => {
    prisma = makeMockPrisma();
    jwtSvc = { sign: jest.fn().mockReturnValue('fake.access.token') };
    const config: MockConfig = { get: jest.fn() };
    service = new AuthService(
      prisma as unknown as ConstructorParameters<typeof AuthService>[0],
      jwtSvc as unknown as ConstructorParameters<typeof AuthService>[1],
      config as unknown as ConstructorParameters<typeof AuthService>[2],
    );
  });

  // ── sendOtp ────────────────────────────────────────────────────────────────

  describe('sendOtp', () => {
    it('rejects invalid phone numbers', async () => {
      await expect(service.sendOtp('12345', OtpPurpose.LOGIN)).rejects.toThrow(BadRequestException);
      await expect(service.sendOtp('5123456789', OtpPurpose.LOGIN)).rejects.toThrow(BadRequestException);
    });

    it('rejects LOGIN when phone is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.sendOtp('9876543210', OtpPurpose.LOGIN)).rejects.toThrow(UnauthorizedException);
    });

    it('rejects REGISTER when phone is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', phone: '9876543210' });
      await expect(service.sendOtp('9876543210', OtpPurpose.REGISTER)).rejects.toThrow(ConflictException);
    });

    it('invalidates previous unused OTPs before creating a new one', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await service.sendOtp('9876543210', OtpPurpose.LOGIN);
      expect(prisma.otpCode.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ phone: '9876543210', usedAt: null }) }),
      );
    });

    it('creates a new OTP code record', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await service.sendOtp('9876543210', OtpPurpose.LOGIN);
      expect(prisma.otpCode.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ phone: '9876543210' }) }),
      );
    });

    it('returns success message', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      const result = await service.sendOtp('9876543210', OtpPurpose.LOGIN);
      expect(result.message).toBeTruthy();
    });
  });

  // ── verifyOtpAndLogin ──────────────────────────────────────────────────────

  describe('verifyOtpAndLogin', () => {
    it('throws when no OTP exists for phone', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(null);
      await expect(service.verifyOtpAndLogin('9876543210', '123456')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when OTP has expired', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(
        makeFakeOtp({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.verifyOtpAndLogin('9876543210', '123456')).rejects.toThrow(UnauthorizedException);
    });

    it('throws when OTP attempts exceed limit', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(makeFakeOtp({ attempts: 3 }));
      await expect(service.verifyOtpAndLogin('9876543210', '123456')).rejects.toThrow(UnauthorizedException);
    });

    it('throws and increments attempts on wrong OTP', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(makeFakeOtp({ code: '999999' }));
      await expect(service.verifyOtpAndLogin('9876543210', '123456')).rejects.toThrow(UnauthorizedException);
      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { attempts: { increment: 1 } } }),
      );
    });

    it('issues tokens on valid OTP', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(makeFakeOtp({ code: '123456' }));
      prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 'u1', phone: '9876543210', name: 'Ravi' });
      const result = await service.verifyOtpAndLogin('9876543210', '123456');
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      expect(result.tokens.expiresIn).toBe(15 * 60);
    });

    it('marks OTP as used after success', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(makeFakeOtp({ id: 'otp1', code: '123456' }));
      prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 'u1', phone: '9876543210', name: 'Ravi' });
      await service.verifyOtpAndLogin('9876543210', '123456');
      expect(prisma.otpCode.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'otp1' }, data: expect.objectContaining({ usedAt: expect.any(Date) }) }),
      );
    });
  });

  // ── verifyOtpAndRegister ───────────────────────────────────────────────────

  describe('verifyOtpAndRegister', () => {
    it('creates user record after valid OTP', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(makeFakeOtp({ code: '111111', purpose: OtpPurpose.REGISTER }));
      prisma.user.create.mockResolvedValue({ id: 'u2', phone: '9876543210', name: 'Priya' });
      await service.verifyOtpAndRegister('9876543210', '111111', 'Priya');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ phone: '9876543210', name: 'Priya' }) }),
      );
    });

    it('returns user and tokens', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(makeFakeOtp({ code: '111111', purpose: OtpPurpose.REGISTER }));
      prisma.user.create.mockResolvedValue({ id: 'u2', phone: '9876543210', name: 'Priya' });
      const result = await service.verifyOtpAndRegister('9876543210', '111111', 'Priya');
      expect(result.user.id).toBe('u2');
      expect(result.tokens.expiresIn).toBe(15 * 60);
    });
  });

  // ── refreshTokens ──────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('throws on unknown refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws on revoked refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        tokenHash: 'h',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 9999999),
      });
      await expect(service.refreshTokens('valid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws on expired refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        tokenHash: 'h',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates token on success — revokes old and issues new', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        tokenHash: 'h',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 9999999),
      });
      prisma.user.findUniqueOrThrow.mockResolvedValue({ id: 'u1', phone: '9876543210' });
      const result = await service.refreshTokens('old-token');
      // old token revoked
      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt1' }, data: { revokedAt: expect.any(Date) } }),
      );
      // new token stored
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });
  });

  // ── revokeRefreshToken ─────────────────────────────────────────────────────

  describe('revokeRefreshToken', () => {
    it('updates the token record to mark it revoked', async () => {
      await service.revokeRefreshToken('some-token');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revokedAt: expect.any(Date) } }),
      );
    });
  });

  // ── validateJwtPayload ─────────────────────────────────────────────────────

  describe('validateJwtPayload', () => {
    it('returns user when active', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', phone: '9876543210' });
      const result = await service.validateJwtPayload({ sub: 'u1', phone: '9876543210' });
      expect(result?.id).toBe('u1');
    });

    it('returns null when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateJwtPayload({ sub: 'missing', phone: '9876543210' });
      expect(result).toBeNull();
    });
  });
});
