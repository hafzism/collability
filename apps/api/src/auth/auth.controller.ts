import { Controller, Post, Body, Get, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from './constants/auth-cookie';
import { UserEntity } from '../users/entities/user.entity';

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
    @Res({ passthrough: true }) response: Response,
  ) {
    const result: { accessToken: string; user: UserEntity } =
      await this.authService.register(registerDto);
    response.cookie(
      AUTH_COOKIE_NAME,
      result.accessToken,
      getAuthCookieOptions(),
    );
    return { user: result.user };
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result: { accessToken: string; user: UserEntity } =
      await this.authService.login(loginDto);
    response.cookie(
      AUTH_COOKIE_NAME,
      result.accessToken,
      getAuthCookieOptions(),
    );

    return { user: result.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    const clearCookieOptions = { ...getAuthCookieOptions() };
    delete clearCookieOptions.maxAge;

    response.clearCookie(AUTH_COOKIE_NAME, clearCookieOptions);

    return {
      message: 'Logged out successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: UserEntity) {
    return user;
  }
}
