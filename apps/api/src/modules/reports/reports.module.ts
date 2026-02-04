// Reports Module
// Financial reports with export functionality

import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsExportService } from './reports-export.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsExportService],
  exports: [ReportsService, ReportsExportService],
})
export class ReportsModule {}
