import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService production auth flow', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const prismaService = {
    emailOtpVerification: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    authSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const configService = {
    get: jest.fn(),
  };

  const authMailerService = {
    sendSignupOtpEmail: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthService(
      usersService as any,
      jwtService as any,
      prismaService as any,
      configService as any,
      authMailerService as any,
    );

    configService.get.mockImplementation((key: string, defaultValue?: string | number) => {
      const values: Record<string, string | number> = {
        JWT_EXPIRES_IN: '15m',
        REFRESH_TOKEN_EXPIRES_IN: '7d',
        REFRESH_TOKEN_SECRET: 'refresh-secret',
        OTP_EXPIRES_MINUTES: 10,
        OTP_VERIFICATION_EXPIRES_IN: '30m',
        OTP_VERIFICATION_SECRET: 'otp-secret',
      };

      return values[key] ?? defaultValue;
    });
  });

  it('returns a success message when requesting an OTP for a new email', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    prismaService.emailOtpVerification.deleteMany.mockResolvedValue({ count: 0 });
    prismaService.emailOtpVerification.create.mockResolvedValue({ id: 'otp-1' });
    authMailerService.sendSignupOtpEmail.mockResolvedValue(undefined);

    await expect((service as any).requestOtp({ email: 'new@company.com' })).resolves.toEqual({
      message: 'Verification code sent successfully',
    });

    expect(authMailerService.sendSignupOtpEmail).toHaveBeenCalledWith(
      'new@company.com',
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it('rejects OTP requests for an existing user', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'existing@company.com',
    });

    await expect((service as any).requestOtp({ email: 'existing@company.com' })).rejects.toThrow(
      new ConflictException('Email already in use'),
    );
  });

  it('returns a verification token for a valid code', async () => {
    prismaService.emailOtpVerification.findFirst.mockResolvedValue({
      id: 'otp-1',
      email: 'new@company.com',
      codeHash: await bcrypt.hash('123456', 10),
      expiresAt: new Date(Date.now() + 60_000),
      verifiedAt: null,
      attempts: 0,
    });
    prismaService.emailOtpVerification.update.mockResolvedValue({ id: 'otp-1' });
    jwtService.sign.mockReturnValue('verified-token');

    await expect(
      (service as any).verifyOtp({ email: 'new@company.com', code: '123456' }),
    ).resolves.toEqual({
      verificationToken: 'verified-token',
    });
  });

  it('creates a user, access token, refresh token, and persisted session on register', async () => {
    usersService.findByEmail.mockResolvedValueOnce(null);
    jwtService.verify.mockReturnValue({
      purpose: 'signup-email-verification',
      email: 'new@company.com',
      verificationId: 'otp-1',
    });
    prismaService.emailOtpVerification.findFirst.mockResolvedValue({
      id: 'otp-1',
      email: 'new@company.com',
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    usersService.create.mockResolvedValue({
      id: 'user-1',
      email: 'new@company.com',
      name: 'New User',
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaService.authSession.create.mockResolvedValue({ id: 'session-1' });
    jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    await expect(
      service.register(
        {
          email: 'new@company.com',
          name: 'New User',
          password: 'secret123',
          verificationToken: 'verified-token',
        } as any,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome on macOS',
        },
      ),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: expect.objectContaining({
        email: 'new@company.com',
        name: 'New User',
      }),
    });

    expect(prismaService.authSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome on macOS',
        expiresAt: expect.any(Date),
        currentRefreshTokenHash: expect.any(String),
      }),
    });
  });

  it('creates a device session on login and returns access and refresh tokens', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new@company.com',
      name: 'New User',
      passwordHash: await bcrypt.hash('secret123', 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaService.authSession.create.mockResolvedValue({ id: 'session-1' });
    jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    await expect(
      service.login(
        {
          email: 'new@company.com',
          password: 'secret123',
        } as any,
        {
          ipAddress: '203.0.113.10',
          userAgent: 'Firefox on Linux',
        },
      ),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: expect.objectContaining({
        email: 'new@company.com',
        name: 'New User',
      }),
    });

    expect(prismaService.authSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        ipAddress: '203.0.113.10',
        userAgent: 'Firefox on Linux',
        currentRefreshTokenHash: expect.any(String),
      }),
    });
  });

  it('rotates the refresh token and updates the session on refresh', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      family: 'family-1',
      type: 'refresh',
    });
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'new@company.com',
      name: 'New User',
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaService.authSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      tokenFamily: 'family-1',
      currentRefreshTokenHash: await bcrypt.hash('refresh-token', 10),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    prismaService.authSession.update.mockResolvedValue({ id: 'session-1' });
    jwtService.sign.mockReturnValueOnce('next-access-token').mockReturnValueOnce('next-refresh-token');

    await expect(
      service.refreshSession('refresh-token', {
        ipAddress: '198.51.100.20',
        userAgent: 'Safari on iPhone',
      }),
    ).resolves.toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      user: expect.objectContaining({
        id: 'user-1',
      }),
    });

    expect(prismaService.authSession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        currentRefreshTokenHash: expect.any(String),
        ipAddress: '198.51.100.20',
        userAgent: 'Safari on iPhone',
        lastSeenAt: expect.any(Date),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it('revokes the entire token family when refresh token reuse is detected', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      family: 'family-1',
      type: 'refresh',
    });
    prismaService.authSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      tokenFamily: 'family-1',
      currentRefreshTokenHash: await bcrypt.hash('different-refresh-token', 10),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    prismaService.authSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.refreshSession('stolen-refresh-token', {
        ipAddress: '192.0.2.77',
        userAgent: 'Unknown client',
      }),
    ).rejects.toThrow(new UnauthorizedException('Refresh token reuse detected'));

    expect(prismaService.authSession.updateMany).toHaveBeenCalledWith({
      where: {
        tokenFamily: 'family-1',
        revokedAt: null,
      },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: 'token_reuse_detected',
      }),
    });
  });

  it('revokes the current session on logout', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      sid: 'session-1',
      family: 'family-1',
      type: 'refresh',
    });
    prismaService.authSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.logoutSession('refresh-token')).resolves.toEqual({
      message: 'Logged out successfully',
    });

    expect(prismaService.authSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        revokedAt: null,
      },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: 'logout',
      }),
    });
  });

  it('lists active sessions with current device information', async () => {
    prismaService.authSession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        userId: 'user-1',
        tokenFamily: 'family-1',
        currentRefreshTokenHash: 'hash',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome on macOS',
        lastSeenAt: new Date('2026-05-20T12:00:00.000Z'),
        expiresAt: new Date('2026-05-27T12:00:00.000Z'),
        revokedAt: null,
        revokedReason: null,
        createdAt: new Date('2026-05-20T10:00:00.000Z'),
        updatedAt: new Date('2026-05-20T12:00:00.000Z'),
      },
    ]);

    await expect(service.listSessions('user-1', 'session-1')).resolves.toEqual([
      expect.objectContaining({
        id: 'session-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome on macOS',
        isCurrent: true,
      }),
    ]);
  });

  it('revokes all other active sessions for the same user', async () => {
    prismaService.authSession.updateMany.mockResolvedValue({ count: 2 });

    await expect(service.logoutOtherSessions('user-1', 'session-1')).resolves.toEqual({
      message: 'Logged out other devices successfully',
    });

    expect(prismaService.authSession.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        id: {
          not: 'session-1',
        },
        revokedAt: null,
      },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: 'logout_other_devices',
      }),
    });
  });

  it('revokes a selected session owned by the same user', async () => {
    prismaService.authSession.findUnique.mockResolvedValue({
      id: 'session-2',
      userId: 'user-1',
      tokenFamily: 'family-2',
      currentRefreshTokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    prismaService.authSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.revokeSession('user-1', 'session-2')).resolves.toEqual({
      message: 'Device logged out successfully',
    });

    expect(prismaService.authSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-2',
        userId: 'user-1',
        revokedAt: null,
      },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: 'device_logout',
      }),
    });
  });
});
