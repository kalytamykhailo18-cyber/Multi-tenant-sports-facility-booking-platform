// WebSocket Module
// Provides global WebSocket gateway for the entire application

import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsGateway } from './ws.gateway';
import { WsJwtGuard } from './ws-jwt.guard';
import { PrismaModule } from '../../prisma';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [WsGateway, WsJwtGuard],
  exports: [WsGateway],
})
export class WsModule {}
