// Create Facility DTO
// Validation for creating a new facility

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
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

export class CreateFacilityDto {
  @ApiProperty({
    description: 'Tenant ID (required for Super Admin creating for a tenant)',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({
    description: 'Facility name',
    example: 'Cancha Los Amigos',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Street address',
    example: 'Av. Corrientes 1234',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'Buenos Aires',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'Country',
    example: 'Argentina',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+54 11 1234-5678',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @ApiProperty({
    description: 'Email address',
    example: 'contacto@canchaslosamigos.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Timezone (IANA format)',
    example: 'America/Argentina/Buenos_Aires',
    default: 'America/Argentina/Buenos_Aires',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'ARS',
    default: 'ARS',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Deposit percentage (0-100)',
    example: 50,
    default: 50,
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
    default: 24,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cancellationHours?: number;

  @ApiPropertyOptional({
    description: 'Minimum hours notice required for booking',
    example: 2,
    default: 2,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minBookingNoticeHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum days in advance a booking can be made',
    example: 30,
    default: 30,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxBookingAdvanceDays?: number;

  @ApiPropertyOptional({
    description: 'Buffer minutes between sessions (0 for no buffer)',
    example: 0,
    default: 0,
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
    default: [60, 90],
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
    description: 'Initial facility status',
    enum: FacilityStatus,
    default: FacilityStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(FacilityStatus)
  status?: FacilityStatus;
}
