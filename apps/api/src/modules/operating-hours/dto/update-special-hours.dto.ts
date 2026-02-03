// Update Special Hours DTO
// Validation for updating special hours

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  Matches,
  IsDateString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateSpecialHoursDto {
  @ApiPropertyOptional({
    description: 'The specific date for this exception (YYYY-MM-DD)',
    example: '2026-12-25',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

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
  openTime?: string | null;

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
  closeTime?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the facility is closed on this date',
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({
    description: 'Reason for the special hours',
    example: 'Feriado - Navidad',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string | null;
}
