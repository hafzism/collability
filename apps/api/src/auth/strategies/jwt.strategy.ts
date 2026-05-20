import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';
import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

type JwtPayload = {
  sub: string;
  type?: string;
  sid?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      secretOrKey: (() => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET must be set');
        return secret;
      })(),
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    (request as AuthenticatedRequest).auth = {
      sessionId: payload.sid,
    };

    return plainToInstance(UserEntity, user);
  }
}
