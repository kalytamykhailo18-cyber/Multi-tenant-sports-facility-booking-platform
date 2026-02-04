// Report Query DTOs
// Request parameters for various financial reports

import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({ description: 'Start date', example: '2026-02-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2026-02-28' })
  @IsDateString()
  endDate: string;
}

export class DailyRevenueQueryDto {
  @ApiProperty({ description: 'Date for revenue report', example: '2026-02-04' })
  @IsDateString()
  date: string;
}

export class WeeklyRevenueQueryDto {
  @ApiProperty({ description: 'Week start date', example: '2026-02-03' })
  @IsDateString()
  weekStart: string;
}

export class MonthlyRevenueQueryDto {
  @ApiProperty({ description: 'Month (YYYY-MM)', example: '2026-02' })
  @IsString()
  month: string;
}

export class CashFlowQueryDto extends DateRangeDto {
  @ApiPropertyOptional({ description: 'Facility ID (optional for super admin)' })
  @IsOptional()
  @IsString()
  facilityId?: string;
}
