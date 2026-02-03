// Update Operating Hours DTO
// Validation for updating operating hours

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  Matches,
  IsInt,
  IsIn,
  IsNotEmpty,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOperatingHoursDto {
  @ApiPropertyOptional({
    description: 'Opening time in HH:mm format',
    example: '08:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be in HH:mm format',
  })
  openTime?: string;

  @ApiPropertyOptional({
    description: 'Closing time in HH:mm format',
    example: '23:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be in HH:mm format',
  })
  closeTime?: string;

  @ApiPropertyOptional({
    description: 'Whether the facility is closed on this day',
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({
    description: 'Session duration in minutes (60 or 90 typical for soccer/padel)',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @IsIn([60, 90, 120], {
    message: 'sessionDurationMinutes must be 60, 90, or 120',
  })
  sessionDurationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Buffer time between sessions in minutes (0, 10, 15, or 30)',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 10, 15, 30], {
    message: 'bufferMinutes must be 0, 10, 15, or 30',
  })
  bufferMinutes?: number;
}

// Single day update item for bulk updates
export class DayScheduleUpdateDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Opening time in HH:mm format',
    example: '08:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be in HH:mm format',
  })
  openTime: string;

  @ApiProperty({
    description: 'Closing time in HH:mm format',
    example: '23:00',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be in HH:mm format',
  })
  closeTime: string;

  @ApiProperty({
    description: 'Whether the facility is closed on this day',
    default: false,
  })
  @IsBoolean()
  isClosed: boolean;

  @ApiPropertyOptional({
    description: 'Session duration in minutes',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @IsIn([60, 90, 120])
  sessionDurationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Buffer time between sessions in minutes',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 10, 15, 30])
  bufferMinutes?: number;
}

// Bulk update for all days at once
export class BulkUpdateOperatingHoursDto {
  @ApiProperty({
    description: 'Schedule for each day of the week',
    type: [DayScheduleUpdateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayScheduleUpdateDto)
  days: DayScheduleUpdateDto[];

  @ApiPropertyOptional({
    description: 'Default session duration in minutes (applies to all days if not specified per day)',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @IsIn([60, 90, 120])
  defaultSessionDurationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Default buffer time between sessions in minutes (applies to all days if not specified per day)',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 10, 15, 30])
  defaultBufferMinutes?: number;
}
