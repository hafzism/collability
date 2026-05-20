import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthMailerService } from './auth-mailer.service';
import { User } from '@repo/database';

type SessionContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type RefreshTokenPayload = {
  sub?: string;
  sid?: string;
  family?: string;
  type?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authMailerService: AuthMailerService,
  ) {}

  async register(registerDto: RegisterDto, sessionContext: SessionContext = {}) {
    const verifiedEmail = await this.validateVerificationToken(registerDto);
    if (verifiedEmail !== registerDto.email) {
      throw new UnauthorizedException('Verification token does not match email');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      email: registerDto.email,
      name: registerDto.name,
      passwordHash,
    });

    return this.createAuthenticatedSession(user, sessionContext);
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const email = requestOtpDto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    await this.prisma.emailOtpVerification.deleteMany({
      where: {
        email,
        verifiedAt: null,
      },
    });

    const otpCode = this.generateOtpCode();
    const codeHash = await bcrypt.hash(otpCode, await bcrypt.genSalt());
    const expiresAt = new Date(Date.now() + this.getOtpExpiresMinutes() * 60_000);

    await this.prisma.emailOtpVerification.create({
      data: {
        email,
        codeHash,
        expiresAt,
      },
    });

    await this.authMailerService.sendSignupOtpEmail(email, otpCode);

    return {
      message: 'Verification code sent successfully',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const email = verifyOtpDto.email.trim().toLowerCase();
    const verification = await this.prisma.emailOtpVerification.findFirst({
      where: {
        email,
        verifiedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification || verification.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    const isMatch = await bcrypt.compare(verifyOtpDto.code, verification.codeHash);
    if (!isMatch) {
      await this.prisma.emailOtpVerification.update({
        where: { id: verification.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      throw new UnauthorizedException('Invalid verification code');
    }

    const verifiedAt = new Date();
    await this.prisma.emailOtpVerification.update({
      where: { id: verification.id },
      data: {
        verifiedAt,
      },
    });

    return {
      verificationToken: this.jwtService.sign(
        {
          purpose: 'signup-email-verification',
          email,
          verificationId: verification.id,
        },
        {
          secret: this.getOtpVerificationSecret(),
          expiresIn: this.getOtpVerificationExpiresIn() as any,
        },
      ),
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return plainToInstance(UserEntity, user);
  }

  async login(loginDto: LoginDto, sessionContext: SessionContext = {}) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    return this.createAuthenticatedSession(user, sessionContext);
  }

  async refreshSession(refreshToken: string, sessionContext: SessionContext = {}) {
    const payload = this.verifyRefreshToken(refreshToken);

    if (!payload.sub || !payload.sid || !payload.family) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.tokenFamily !== payload.family ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isCurrentToken = await bcrypt.compare(refreshToken, session.currentRefreshTokenHash);
    if (!isCurrentToken) {
      await this.revokeTokenFamily(payload.family, 'token_reuse_detected');
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      await this.prisma.authSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'user_not_found',
        },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userEntity = plainToInstance(UserEntity, user);
    const accessToken = this.signAccessToken(userEntity, session.id);
    const nextRefreshToken = this.signRefreshToken({
      sub: userEntity.id,
      sid: session.id,
      family: session.tokenFamily,
      type: 'refresh',
    });

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        currentRefreshTokenHash: await this.hashToken(nextRefreshToken),
        ipAddress: sessionContext.ipAddress ?? undefined,
        userAgent: sessionContext.userAgent ?? undefined,
        lastSeenAt: new Date(),
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    return {
      accessToken,
      refreshToken: nextRefreshToken,
      user: userEntity,
    };
  }

  async logoutSession(refreshToken?: string | null) {
    if (!refreshToken) {
      return {
        message: 'Logged out successfully',
      };
    }

    try {
      const payload = this.verifyRefreshToken(refreshToken);
      if (payload.sid) {
        await this.prisma.authSession.updateMany({
          where: {
            id: payload.sid,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            revokedReason: 'logout',
          },
        });
      }
    } catch {
      return {
        message: 'Logged out successfully',
      };
    }

    return {
      message: 'Logged out successfully',
    };
  }

  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      isCurrent: session.id === currentSessionId,
    }));
  }

  async logoutOtherSessions(userId: string, currentSessionId?: string) {
    if (!currentSessionId) {
      throw new UnauthorizedException('Current session is required');
    }

    await this.prisma.authSession.updateMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'logout_other_devices',
      },
    });

    return {
      message: 'Logged out other devices successfully',
    };
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.authSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Device session not found');
    }

    await this.prisma.authSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'device_logout',
      },
    });

    return {
      message: 'Device logged out successfully',
    };
  }

  private async validateVerificationToken(registerDto: RegisterDto) {
    if (!registerDto.verificationToken) {
      throw new UnauthorizedException('Email verification is required');
    }

    let payload: { email?: string; purpose?: string; verificationId?: string };

    try {
      payload = this.jwtService.verify(registerDto.verificationToken, {
        secret: this.getOtpVerificationSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (
      payload.purpose !== 'signup-email-verification' ||
      !payload.email ||
      !payload.verificationId
    ) {
      throw new UnauthorizedException('Invalid verification token');
    }

    const verification = await this.prisma.emailOtpVerification.findFirst({
      where: {
        id: payload.verificationId,
        email: payload.email,
        verifiedAt: {
          not: null,
        },
      },
    });

    if (!verification) {
      throw new UnauthorizedException('Email verification is required');
    }

    return payload.email;
  }

  private generateOtpCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async createAuthenticatedSession(user: UserEntity | User, sessionContext: SessionContext) {
    const userEntity = plainToInstance(UserEntity, user);
    const sessionId = randomUUID();
    const tokenFamily = randomUUID();
    const accessToken = this.signAccessToken(userEntity, sessionId);
    const refreshToken = this.signRefreshToken({
      sub: userEntity.id,
      sid: sessionId,
      family: tokenFamily,
      type: 'refresh',
    });

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: userEntity.id,
        tokenFamily,
        currentRefreshTokenHash: await this.hashToken(refreshToken),
        ipAddress: sessionContext.ipAddress ?? null,
        userAgent: sessionContext.userAgent ?? null,
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: userEntity,
    };
  }

  private signAccessToken(user: UserEntity, sessionId?: string) {
    return this.jwtService.sign(
      {
        email: user.email,
        sid: sessionId,
        sub: user.id,
        type: 'access',
      },
      {
        expiresIn: this.getJwtExpiresIn() as any,
      },
    );
  }

  private signRefreshToken(payload: { sub: string; sid: string; family: string; type: 'refresh' }) {
    return this.jwtService.sign(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: this.getRefreshTokenExpiresIn() as any,
    });
  }

  private verifyRefreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: RefreshTokenPayload;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload;
  }

  private async revokeTokenFamily(tokenFamily: string, revokedReason: string) {
    await this.prisma.authSession.updateMany({
      where: {
        tokenFamily,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason,
      },
    });
  }

  private async hashToken(token: string) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(token, salt);
  }

  private getJwtExpiresIn() {
    return this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';
  }

  private getRefreshTokenExpiresIn() {
    return this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN') ?? '7d';
  }

  private getRefreshTokenExpiresAt() {
    return new Date(Date.now() + this.getRefreshTokenTtlMs());
  }

  private getRefreshTokenTtlMs() {
    return Number(this.configService.get<string>('REFRESH_TOKEN_TTL_MS') ?? 7 * 24 * 60 * 60 * 1000);
  }

  private getRefreshTokenSecret() {
    return (
      this.configService.get<string>('REFRESH_TOKEN_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'development-refresh-secret'
    );
  }

  private getOtpExpiresMinutes() {
    return Number(this.configService.get<string>('OTP_EXPIRES_MINUTES') ?? 10);
  }

  private getOtpVerificationExpiresIn() {
    return this.configService.get<string>('OTP_VERIFICATION_EXPIRES_IN') ?? '30m';
  }

  private getOtpVerificationSecret() {
    return (
      this.configService.get<string>('OTP_VERIFICATION_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'development-otp-secret'
    );
  }
}
