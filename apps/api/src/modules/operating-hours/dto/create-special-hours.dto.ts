// Create Special Hours DTO
// Validation for creating special hours (holidays, closures, exceptions)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  Matches,
  IsDateString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateSpecialHoursDto {
  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890facility',
  })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({
    description: 'The specific date for this exception (YYYY-MM-DD)',
    example: '2026-12-25',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Opening time in HH:mm format (null if closed)',
    example: '10:00',
  })
  @IsOptional()
  @ValidateIf((o) => !o.isClosed)
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime must be in HH:mm format',
  })
  openTime?: string;

  @ApiPropertyOptional({
    description: 'Closing time in HH:mm format (null if closed)',
    example: '18:00',
  })
  @IsOptional()
  @ValidateIf((o) => !o.isClosed)
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime must be in HH:mm format',
  })
  closeTime?: string;

  @ApiProperty({
    description: 'Whether the facility is closed on this date',
    default: true,
  })
  @IsBoolean()
  isClosed: boolean;

  @ApiPropertyOptional({
    description: 'Reason for the special hours (e.g., "Feriado", "Mantenimiento", "Vacaciones")',
    example: 'Feriado - Navidad',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
