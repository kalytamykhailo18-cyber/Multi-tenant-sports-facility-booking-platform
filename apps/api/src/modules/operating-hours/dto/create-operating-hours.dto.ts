// Create Operating Hours DTO
// Validation for creating operating hours for a facility

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  Matches,
  IsIn,
} from 'class-validator';

export class CreateOperatingHoursDto {
  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890facility',
  })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

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
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be in HH:mm format',
  })
  openTime: string;

  @ApiProperty({
    description: 'Closing time in HH:mm format',
    example: '23:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be in HH:mm format',
  })
  closeTime: string;

  @ApiPropertyOptional({
    description: 'Whether the facility is closed on this day',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({
    description: 'Session duration in minutes (60 or 90 typical for soccer/padel)',
    example: 60,
    default: 60,
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
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 10, 15, 30], {
    message: 'bufferMinutes must be 0, 10, 15, or 30',
  })
  bufferMinutes?: number;
}

// DTO for bulk creating/updating operating hours for all days of the week
export class BulkCreateOperatingHoursDto {
  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890facility',
  })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({
    description: 'Operating hours for each day of the week',
    type: [CreateOperatingHoursDto],
    isArray: true,
  })
  days: Omit<CreateOperatingHoursDto, 'facilityId'>[];
}
