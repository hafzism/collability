import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { BoardEventsGateway } from './board-events.gateway';
import { BoardEventsService } from './board-events.service';

@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET must be set');
        }

        return {
          secret,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [BoardEventsGateway, BoardEventsService],
  exports: [BoardEventsService],
})
export class RealtimeModule {}
