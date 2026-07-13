import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyPasswordResetDto } from './dto/verify-password-reset.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  REFRESH_TOKEN_COOKIE_NAME,
  getRefreshTokenCookieOptions,
} from './constants/auth-cookie';
import { UserEntity } from '../users/entities/user.entity';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const GOOGLE_OAUTH_STATE_COOKIE_NAME = 'collability_google_oauth_state';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('request-otp')
  async requestOtp(@Body() requestOtpDto: RequestOtpDto) {
    return this.authService.requestOtp(requestOtpDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('request-password-reset')
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('verify-password-reset')
  async verifyPasswordReset(@Body() verifyPasswordResetDto: VerifyPasswordResetDto) {
    return this.authService.verifyPasswordReset(verifyPasswordResetDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('google')
  googleAuth(@Res() response: Response) {
    const state = randomUUID();
    response.cookie(
      GOOGLE_OAUTH_STATE_COOKIE_NAME,
      state,
      this.getGoogleOAuthStateCookieOptions(),
    );
    return response.redirect(this.authService.getGoogleAuthorizationUrl(state));
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const { maxAge: _maxAge, ...clearCookieOptions } =
      this.getGoogleOAuthStateCookieOptions();
    response.clearCookie(GOOGLE_OAUTH_STATE_COOKIE_NAME, clearCookieOptions);

    const expectedState = request.cookies?.[GOOGLE_OAUTH_STATE_COOKIE_NAME];
    if (!state || !expectedState || state !== expectedState || !code) {
      return response.redirect(
        this.buildAuthCallbackUrl({
          error: 'Google sign-in could not be verified. Please try again.',
        }),
      );
    }

    try {
      const result: { accessToken: string; refreshToken: string; user: UserEntity } =
        await this.authService.loginWithGoogle(code, this.getSessionContext(request));
      response.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        getRefreshTokenCookieOptions(),
      );

      return response.redirect(
        this.buildAuthCallbackUrl({
          accessToken: result.accessToken,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      return response.redirect(this.buildAuthCallbackUrl({ error: message }));
    }
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result: { accessToken: string; refreshToken: string; user: UserEntity } =
      await this.authService.register(registerDto, this.getSessionContext(request));
    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      result.refreshToken,
      getRefreshTokenCookieOptions(),
    );
    return { accessToken: result.accessToken, user: result.user };
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result: { accessToken: string; refreshToken: string; user: UserEntity } =
      await this.authService.login(loginDto, this.getSessionContext(request));
    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      result.refreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result: { accessToken: string; refreshToken: string; user: UserEntity } =
      await this.authService.refreshSession(
        request.cookies?.[REFRESH_TOKEN_COOKIE_NAME],
        this.getSessionContext(request),
      );

    response.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      result.refreshToken,
      getRefreshTokenCookieOptions(),
    );

    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.logoutSession(
      request.cookies?.[REFRESH_TOKEN_COOKIE_NAME],
    );

    const clearCookieOptions = { ...getRefreshTokenCookieOptions() };
    delete clearCookieOptions.maxAge;

    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearCookieOptions);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: UserEntity) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  getSessions(@Req() request: AuthenticatedRequest) {
    return this.authService.listSessions(request.user.id, request.auth?.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-others')
  logoutOtherSessions(@Req() request: AuthenticatedRequest) {
    return this.authService.logoutOtherSessions(
      request.user.id,
      request.auth?.sessionId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  revokeSession(
    @Param('sessionId') sessionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.revokeSession(request.user.id, sessionId);
  }

  private getSessionContext(request: Request) {
    const forwardedForHeader = request.headers['x-forwarded-for'];
    const forwardedFor = Array.isArray(forwardedForHeader)
      ? forwardedForHeader[0]
      : forwardedForHeader;
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || request.ip || null;
    const userAgentHeader = request.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader[0]
      : userAgentHeader;

    return {
      ipAddress,
      userAgent: userAgent ?? null,
    };
  }

  private getGoogleOAuthStateCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/auth/google',
      maxAge: 10 * 60 * 1000,
    };
  }

  private buildAuthCallbackUrl(input: { accessToken?: string; error?: string }) {
    const webAppUrl = process.env.WEB_APP_URL;
    if (!webAppUrl) {
      throw new Error('WEB_APP_URL must be set');
    }

    const callbackUrl = new URL('/auth/callback', webAppUrl);
    const fragment = new URLSearchParams();
    if (input.accessToken) {
      fragment.set('access_token', input.accessToken);
    }
    if (input.error) {
      fragment.set('error', input.error);
    }
    callbackUrl.hash = fragment.toString();

    return callbackUrl.toString();
  }
}
