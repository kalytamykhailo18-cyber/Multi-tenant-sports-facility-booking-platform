// Opponent Match Module
// Find a rival feature for matching players

import { Module } from '@nestjs/common';
import { OpponentMatchController } from './opponent-match.controller';
import { OpponentMatchService } from './opponent-match.service';
import { OpponentMatchGateway } from './opponent-match.gateway';

@Module({
  controllers: [OpponentMatchController],
  providers: [OpponentMatchService, OpponentMatchGateway],
  exports: [OpponentMatchService, OpponentMatchGateway],
})
export class OpponentMatchModule {}
