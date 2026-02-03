// Operating Hours Module
// Module configuration for operating hours and special hours management

import { Module } from '@nestjs/common';
import { OperatingHoursController } from './operating-hours.controller';
import { OperatingHoursService } from './operating-hours.service';

@Module({
  controllers: [OperatingHoursController],
  providers: [OperatingHoursService],
  exports: [OperatingHoursService],
})
export class OperatingHoursModule {}
