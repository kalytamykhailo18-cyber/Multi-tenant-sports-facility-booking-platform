// Bookings Module
// Handles booking management and time slot generation

import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsGateway } from './bookings.gateway';
import { TimeSlotsService } from './time-slots.service';
import { TimeSlotsController } from './time-slots.controller';
import { OperatingHoursModule } from '../operating-hours/operating-hours.module';

@Module({
  imports: [OperatingHoursModule],
  controllers: [BookingsController, TimeSlotsController],
  providers: [BookingsService, BookingsGateway, TimeSlotsService],
  exports: [BookingsService, TimeSlotsService],
})
export class BookingsModule {}
