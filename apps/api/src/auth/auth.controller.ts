import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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
}
