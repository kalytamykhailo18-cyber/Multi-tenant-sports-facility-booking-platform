// Notifications Module
// Handles all proactive notification services

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { MorningMessageService } from './services/morning-message.service';
import { ReminderService } from './services/reminder.service';
import { WaitingListService } from './services/waiting-list.service';
import { QUEUE_NAMES } from '../../common/queue/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.OUTGOING_WHATSAPP,
    }),
  ],
  providers: [
    NotificationsService,
    MorningMessageService,
    ReminderService,
    WaitingListService,
  ],
  exports: [
    NotificationsService,
    MorningMessageService,
    ReminderService,
    WaitingListService,
  ],
})
export class NotificationsModule {}
