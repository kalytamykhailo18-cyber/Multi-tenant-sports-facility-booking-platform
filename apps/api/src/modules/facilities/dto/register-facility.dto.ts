// Register Facility DTO
// Complete facility registration for Super Admin (creates tenant + facility + owner + subscription)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  MinLength,
  IsEnum,
} from 'class-validator';
import { FacilityStatus, SportType } from '@sports-booking/database';

/**
 * DTO for complete facility registration by Super Admin
 * Creates tenant, facility, owner user, and subscription in one transaction
 */
export class RegisterFacilityDto {
  // Facility Information
  @ApiProperty({
    description: 'Facility name',
    example: 'Cancha Los Amigos',
  })
  @IsString()
  @IsNotEmpty()
  facilityName: string;

  @ApiProperty({
    description: 'Business name (legal name)',
    example: 'Los Amigos S.A.',
  })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({
    description: 'Street address',
    example: 'Av. Corrientes 1234',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'Monte Grande',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Country',
    example: 'Argentina',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'Facility phone number',
    example: '+54 11 1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  facilityPhone: string;

  @ApiProperty({
    description: 'Facility email',
    example: 'contacto@canchaslosamigos.com',
  })
  @IsEmail()
  @IsNotEmpty()
  facilityEmail: string;

  // Owner Information
  @ApiProperty({
    description: 'Owner full name',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({
    description: 'Owner email (used for login)',
    example: 'juan@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  ownerEmail: string;

  @ApiProperty({
    description: 'Owner phone (for escalation alerts)',
    example: '+54 11 9876-5432',
  })
  @IsString()
  @IsNotEmpty()
  ownerPhone: string;

  @ApiProperty({
    description: 'Temporary password for owner',
    example: 'TempPass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  ownerPassword: string;

  // Configuration
  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/Argentina/Buenos_Aires',
    default: 'America/Argentina/Buenos_Aires',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'ARS',
    default: 'ARS',
  })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Deposit percentage (0-100)',
    example: 50,
    default: 50,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  depositPercentage?: number;

  @ApiPropertyOptional({
    description: 'Cancellation hours for full credit',
    example: 24,
    default: 24,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cancellationHours?: number;

  @ApiPropertyOptional({
    description: 'Minimum booking notice in hours',
    example: 2,
    default: 2,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minBookingNoticeHours?: number;

  @ApiPropertyOptional({
    description: 'Maximum advance booking in days',
    example: 30,
    default: 30,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxBookingAdvanceDays?: number;

  @ApiPropertyOptional({
    description: 'Buffer minutes between sessions',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bufferMinutes?: number;

  @ApiPropertyOptional({
    description: 'Allowed session durations in minutes',
    example: [60, 90],
    default: [60, 90],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  sessionDurationMinutes?: number[];

  @ApiPropertyOptional({
    description: 'WhatsApp phone number',
    example: '+54 11 9876-5432',
  })
  @IsString()
  @IsOptional()
  whatsappPhone?: string;

  @ApiPropertyOptional({
    description: 'Facility status',
    enum: FacilityStatus,
    default: FacilityStatus.ACTIVE,
  })
  @IsEnum(FacilityStatus)
  @IsOptional()
  status?: FacilityStatus;

  // Subscription
  @ApiProperty({
    description: 'Monthly subscription price in local currency',
    example: 10000,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  monthlyPrice: number;

  @ApiPropertyOptional({
    description: 'First payment due date (ISO 8601)',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsString()
  @IsOptional()
  firstDueDate?: string;
}

/**
 * Response DTO for facility registration
 */
export class RegisterFacilityResponseDto {
  @ApiProperty({
    description: 'Created tenant ID',
    example: 'clx0987654321fedcba',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Created facility ID',
    example: 'clx1234567890abcdef',
  })
  facilityId: string;

  @ApiProperty({
    description: 'Created owner user ID',
    example: 'clx1111222233334444',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Created subscription ID',
    example: 'clx5555666677778888',
  })
  subscriptionId: string;

  @ApiProperty({
    description: 'Owner login email',
    example: 'juan@example.com',
  })
  ownerEmail: string;

  @ApiProperty({
    description: 'Facility name',
    example: 'Cancha Los Amigos',
  })
  facilityName: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Facility registered successfully',
  })
  message: string;
}
