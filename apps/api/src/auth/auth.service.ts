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
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPasswordResetDto } from './dto/verify-password-reset.dto';
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

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
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
    const email = registerDto.email.trim().toLowerCase();
    const verifiedEmail = await this.validateVerificationToken(registerDto);
    if (verifiedEmail !== email) {
      throw new UnauthorizedException('Verification token does not match email');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.usersService.create({
      email,
      name: registerDto.name,
      passwordHash,
      authProvider: 'EMAIL',
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
        purpose: 'SIGNUP',
      },
    });

    const otpCode = this.generateOtpCode();
    const codeHash = await bcrypt.hash(otpCode, await bcrypt.genSalt());
    const expiresAt = new Date(Date.now() + this.getOtpExpiresMinutes() * 60_000);

    await this.prisma.emailOtpVerification.create({
      data: {
        email,
        codeHash,
        purpose: 'SIGNUP',
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
        purpose: 'SIGNUP',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification || verification.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    if (verification.attempts >= 5) {
      throw new UnauthorizedException('Too many invalid attempts. Request a new code');
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
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authProvider !== 'EMAIL' || !user.passwordHash) {
      throw new UnauthorizedException('This account uses Google sign-in');
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

  getGoogleAuthorizationUrl(state: string) {
    const params = new URLSearchParams({
      client_id: this.getGoogleClientId(),
      redirect_uri: this.getGoogleRedirectUri(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async loginWithGoogle(code: string, sessionContext: SessionContext = {}) {
    if (!code) {
      throw new UnauthorizedException('Google authorization failed');
    }

    const googleUser = await this.fetchGoogleUser(code);
    if (!googleUser.sub || !googleUser.email || !googleUser.email_verified) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    const email = googleUser.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser && existingUser.authProvider !== 'GOOGLE') {
      throw new ConflictException('This email uses password sign-in');
    }

    if (existingUser && existingUser.googleId !== googleUser.sub) {
      throw new ConflictException('This email is linked to another Google account');
    }

    const user =
      existingUser ??
      (await this.usersService.create({
        email,
        name: googleUser.name?.trim() || email.split('@')[0],
        avatarUrl: googleUser.picture,
        passwordHash: null,
        authProvider: 'GOOGLE',
        googleId: googleUser.sub,
      }));

    return this.createAuthenticatedSession(user, sessionContext);
  }

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto) {
    const email = requestPasswordResetDto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return {
        message: 'If an email account exists, a reset code has been sent',
      };
    }

    if (user.authProvider !== 'EMAIL' || !user.passwordHash) {
      throw new ConflictException('This account uses Google sign-in');
    }

    await this.prisma.emailOtpVerification.deleteMany({
      where: {
        email,
        purpose: 'PASSWORD_RESET',
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
        purpose: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    await this.authMailerService.sendPasswordResetOtpEmail(email, otpCode);

    return {
      message: 'Password reset code sent successfully',
    };
  }

  async verifyPasswordReset(verifyPasswordResetDto: VerifyPasswordResetDto) {
    const email = verifyPasswordResetDto.email.trim().toLowerCase();
    const verification = await this.prisma.emailOtpVerification.findFirst({
      where: {
        email,
        verifiedAt: null,
        purpose: 'PASSWORD_RESET',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification || verification.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    if (verification.attempts >= 5) {
      throw new UnauthorizedException('Too many invalid attempts. Request a new code');
    }

    const isMatch = await bcrypt.compare(verifyPasswordResetDto.code, verification.codeHash);
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

    await this.prisma.emailOtpVerification.update({
      where: { id: verification.id },
      data: {
        verifiedAt: new Date(),
      },
    });

    return {
      resetToken: this.jwtService.sign(
        {
          purpose: 'password-reset',
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

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const email = resetPasswordDto.email.trim().toLowerCase();
    const verifiedEmail = await this.validatePasswordResetToken(resetPasswordDto);
    if (verifiedEmail !== email) {
      throw new UnauthorizedException('Reset token does not match email');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (user.authProvider !== 'EMAIL' || !user.passwordHash) {
      throw new ConflictException('This account uses Google sign-in');
    }

    const passwordHash = await bcrypt.hash(resetPasswordDto.password, await bcrypt.genSalt());
    await this.usersService.update(user.id, { passwordHash });
    await this.prisma.authSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: 'password_reset',
      },
    });

    return {
      message: 'Password reset successfully',
    };
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

  private async validatePasswordResetToken(resetPasswordDto: ResetPasswordDto) {
    if (!resetPasswordDto.resetToken) {
      throw new UnauthorizedException('Password reset verification is required');
    }

    let payload: { email?: string; purpose?: string; verificationId?: string };

    try {
      payload = this.jwtService.verify(resetPasswordDto.resetToken, {
        secret: this.getOtpVerificationSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid reset token');
    }

    if (payload.purpose !== 'password-reset' || !payload.email || !payload.verificationId) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const verification = await this.prisma.emailOtpVerification.findFirst({
      where: {
        id: payload.verificationId,
        email: payload.email,
        purpose: 'PASSWORD_RESET',
        verifiedAt: {
          not: null,
        },
      },
    });

    if (!verification) {
      throw new UnauthorizedException('Password reset verification is required');
    }

    return payload.email;
  }

  private async fetchGoogleUser(code: string): Promise<GoogleUserInfo> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.getGoogleClientId(),
        client_secret: this.getGoogleClientSecret(),
        redirect_uri: this.getGoogleRedirectUri(),
        grant_type: 'authorization_code',
      }),
    });

    const tokenBody = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokenResponse.ok || !tokenBody.access_token) {
      throw new UnauthorizedException(
        tokenBody.error_description || 'Google token exchange failed',
      );
    }

    const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenBody.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new UnauthorizedException('Google profile lookup failed');
    }

    return (await userResponse.json()) as GoogleUserInfo;
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
    const value = this.configService.get<string>('JWT_EXPIRES_IN');
    if (!value) {
      throw new Error('JWT_EXPIRES_IN must be set');
    }
    return value;
  }

  private getRefreshTokenExpiresIn() {
    const value = this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN');
    if (!value) {
      throw new Error('REFRESH_TOKEN_EXPIRES_IN must be set');
    }
    return value;
  }

  private getRefreshTokenExpiresAt() {
    return new Date(Date.now() + this.getRefreshTokenTtlMs());
  }

  private getRefreshTokenTtlMs() {
    const value = this.configService.get<string>('REFRESH_TOKEN_TTL_MS');
    if (!value) {
      throw new Error('REFRESH_TOKEN_TTL_MS must be set');
    }
    return Number(value);
  }

  private getRefreshTokenSecret() {
    const value = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    if (!value) {
      throw new Error('REFRESH_TOKEN_SECRET must be set');
    }
    return value;
  }

  private getOtpExpiresMinutes() {
    const value = this.configService.get<string>('OTP_EXPIRES_MINUTES');
    if (!value) {
      throw new Error('OTP_EXPIRES_MINUTES must be set');
    }
    return Number(value);
  }

  private getOtpVerificationExpiresIn() {
    const value = this.configService.get<string>('OTP_VERIFICATION_EXPIRES_IN');
    if (!value) {
      throw new Error('OTP_VERIFICATION_EXPIRES_IN must be set');
    }
    return value;
  }

  private getOtpVerificationSecret() {
    const value = this.configService.get<string>('OTP_VERIFICATION_SECRET');
    if (!value) {
      throw new Error('OTP_VERIFICATION_SECRET must be set');
    }
    return value;
  }

  private getGoogleClientId() {
    const value = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!value) {
      throw new Error('GOOGLE_CLIENT_ID must be set');
    }
    return value;
  }

  private getGoogleClientSecret() {
    const value = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!value) {
      throw new Error('GOOGLE_CLIENT_SECRET must be set');
    }
    return value;
  }

  private getGoogleRedirectUri() {
    const value = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    if (!value) {
      throw new Error('GOOGLE_REDIRECT_URI must be set');
    }
    return value;
  }
}
