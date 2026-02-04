import { Module } from '@nestjs/common';
import { TakeoverController } from './takeover.controller';
import { TakeoverService } from './takeover.service';
import { RedisModule } from '../../redis/redis.module';
import { WsModule } from '../../common/gateway/ws.module';

@Module({
  imports: [RedisModule, WsModule],
  controllers: [TakeoverController],
  providers: [TakeoverService],
  exports: [TakeoverService],
})
export class TakeoverModule {}
