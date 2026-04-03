import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService OTP signup flow', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
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

  it('invalidates previous unverified OTPs before sending a new code', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    prismaService.emailOtpVerification.deleteMany.mockResolvedValue({ count: 1 });
    prismaService.emailOtpVerification.create.mockResolvedValue({ id: 'otp-2' });
    authMailerService.sendSignupOtpEmail.mockResolvedValue(undefined);

    await expect((service as any).requestOtp({ email: 'new@company.com' })).resolves.toEqual({
      message: 'Verification code sent successfully',
    });

    expect(prismaService.emailOtpVerification.deleteMany).toHaveBeenCalledWith({
      where: {
        email: 'new@company.com',
        verifiedAt: null,
      },
    });
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

  it('rejects an invalid verification code', async () => {
    prismaService.emailOtpVerification.findFirst.mockResolvedValue({
      id: 'otp-1',
      email: 'new@company.com',
      codeHash: await bcrypt.hash('123456', 10),
      expiresAt: new Date(Date.now() + 60_000),
      verifiedAt: null,
      attempts: 0,
    });
    prismaService.emailOtpVerification.update.mockResolvedValue({ id: 'otp-1', attempts: 1 });

    await expect(
      (service as any).verifyOtp({ email: 'new@company.com', code: '999999' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid verification code'));
  });

  it('rejects register when verification token is missing', async () => {
    await expect(
      service.register({
        email: 'new@company.com',
        name: 'New User',
        password: 'secret123',
      } as any),
    ).rejects.toThrow(new UnauthorizedException('Email verification is required'));
  });

  it('creates a user when the verification token is valid and verified', async () => {
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
    jwtService.sign.mockReturnValue('access-token');
    usersService.create.mockResolvedValue({
      id: 'user-1',
      email: 'new@company.com',
      name: 'New User',
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.register({
        email: 'new@company.com',
        name: 'New User',
        password: 'secret123',
        verificationToken: 'verified-token',
      } as any),
    ).resolves.toEqual({
      accessToken: 'access-token',
      user: expect.objectContaining({
        email: 'new@company.com',
        name: 'New User',
      }),
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      email: 'new@company.com',
      sub: 'user-1',
    });
  });

  it('returns accessToken and user on successful login', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'new@company.com',
      name: 'New User',
      passwordHash: await bcrypt.hash('secret123', 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtService.sign.mockReturnValue('access-token');

    await expect(
      service.login({
        email: 'new@company.com',
        password: 'secret123',
      } as any),
    ).resolves.toEqual({
      accessToken: 'access-token',
      user: expect.objectContaining({
        email: 'new@company.com',
        name: 'New User',
      }),
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      email: 'new@company.com',
      sub: 'user-1',
    });
  });
});
