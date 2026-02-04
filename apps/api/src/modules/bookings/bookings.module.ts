// Bookings Module
// Handles booking management and time slot generation

import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsGateway } from './bookings.gateway';
import { TimeSlotsService } from './time-slots.service';
import { TimeSlotsController } from './time-slots.controller';
import { OperatingHoursModule } from '../operating-hours/operating-hours.module';
import { CreditsModule } from '../credits/credits.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, OperatingHoursModule, forwardRef(() => CreditsModule)],
  controllers: [BookingsController, TimeSlotsController],
  providers: [BookingsService, BookingsGateway, TimeSlotsService],
  exports: [BookingsService, TimeSlotsService],
})
export class BookingsModule {}
