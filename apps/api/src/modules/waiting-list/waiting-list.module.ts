// Waiting List Module
// TODO: Implement in Phase 8.3

import { Module } from '@nestjs/common';
import { WaitingListService } from './waiting-list.service';

@Module({
  providers: [WaitingListService],
  exports: [WaitingListService],
})
export class WaitingListModule {}
