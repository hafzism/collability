import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from '../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthMailerService } from './auth-mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly authMailerService: AuthMailerService,
  ) {}

  async register(registerDto: RegisterDto) {
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

    return plainToInstance(UserEntity, user);
  }

  async requestOtp(requestOtpDto: RequestOtpDto) {
    const email = requestOtpDto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

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

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user,
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
