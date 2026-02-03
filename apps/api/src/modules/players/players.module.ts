// Players Module
// TODO: Implement in Phase 12

import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { MatchingService } from './matching.service';
import { PlayersController } from './players.controller';

@Module({
  controllers: [PlayersController],
  providers: [PlayersService, MatchingService],
  exports: [PlayersService, MatchingService],
})
export class PlayersModule {}
