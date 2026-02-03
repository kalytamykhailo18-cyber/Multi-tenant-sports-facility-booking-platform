// Update Facility DTO
// Validation for updating an existing facility

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  IsEnum,
} from 'class-validator';
import { FacilityStatus } from '@prisma/client';

export class UpdateFacilityDto {
  @ApiPropertyOptional({
    description: 'Facility name',
    example: 'Cancha Los Amigos',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Street address',
    example: 'Av. Corrientes 1234',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Buenos Aires',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'Argentina',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+54 11 1234-5678',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'contacto@canchaslosamigos.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Timezone (IANA format)',
    example: 'America/Argentina/Buenos_Aires',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'ARS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Deposit percentage (0-100)',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  depositPercentage?: number;

  @ApiPropertyOptional({
    description: 'Hours before booking for full credit on cancellation',
    example: 24,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationHours?: number;

  @ApiPropertyOptional({
    description: 'Minimum hours notice required for booking',
    example: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBookingNoticeHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum days in advance a booking can be made',
    example: 30,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxBookingAdvanceDays?: number;

  @ApiPropertyOptional({
    description: 'Buffer minutes between sessions',
    example: 0,
    minimum: 0,
    maximum: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferMinutes?: number;

  @ApiPropertyOptional({
    description: 'Allowed session durations in minutes',
    example: [60, 90],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  sessionDurationMinutes?: number[];

  @ApiPropertyOptional({
    description: 'WhatsApp phone number',
    example: '+54 11 9876-5432',
  })
  @IsOptional()
  @IsString()
  whatsappPhone?: string;

  @ApiPropertyOptional({
    description: 'Facility status',
    enum: FacilityStatus,
  })
  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;
}
