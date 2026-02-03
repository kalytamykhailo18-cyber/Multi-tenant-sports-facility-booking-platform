// Operating Hours Response DTOs
// Response types for operating hours endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OperatingHoursResponseDto {
  @ApiProperty({
    description: 'Operating hours unique identifier',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: 'clx1234567890tenant',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890facility',
  })
  facilityId: string;

  @ApiProperty({
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
    example: 1,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Opening time in HH:mm format',
    example: '08:00',
  })
  openTime: string;

  @ApiProperty({
    description: 'Closing time in HH:mm format',
    example: '23:00',
  })
  closeTime: string;

  @ApiProperty({
    description: 'Whether the facility is closed on this day',
    example: false,
  })
  isClosed: boolean;

  @ApiProperty({
    description: 'Session duration in minutes',
    example: 60,
  })
  sessionDurationMinutes: number;

  @ApiProperty({
    description: 'Buffer time between sessions in minutes',
    example: 0,
  })
  bufferMinutes: number;

  @ApiProperty({
    description: 'Date when record was created',
    example: '2026-02-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when record was last updated',
    example: '2026-02-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Day name for display (e.g., "Lunes", "Martes")',
    example: 'Lunes',
  })
  dayName?: string;
}

// Weekly schedule response containing all 7 days
export class WeeklyScheduleResponseDto {
  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890facility',
  })
  facilityId: string;

  @ApiProperty({
    description: 'Operating hours for all days of the week',
    type: [OperatingHoursResponseDto],
  })
  days: OperatingHoursResponseDto[];

  @ApiProperty({
    description: 'Default session duration configured for the facility',
    example: 60,
  })
  defaultSessionDurationMinutes: number;

  @ApiProperty({
    description: 'Default buffer minutes configured for the facility',
    example: 0,
  })
  defaultBufferMinutes: number;
}
