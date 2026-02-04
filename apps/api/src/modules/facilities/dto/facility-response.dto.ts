// Facility Response DTO
// Response format for facility data

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FacilityStatus } from '@prisma/client';

// Connection status for integrations
export class CredentialsStatusDto {
  @ApiProperty({
    description: 'WhatsApp connected via Baileys',
    example: true
  })
  whatsappConnected: boolean;

  @ApiPropertyOptional({
    description: 'WhatsApp last seen timestamp',
    example: '2024-02-01T12:00:00.000Z',
    nullable: true,
  })
  whatsappLastSeen?: Date | null;

  @ApiProperty({
    description: 'Mercado Pago connected via OAuth',
    example: true
  })
  mercadoPagoConnected: boolean;

  @ApiPropertyOptional({
    description: 'Mercado Pago OAuth token expiration',
    example: '2024-08-01T12:00:00.000Z',
    nullable: true,
  })
  mercadoPagoTokenExpires?: Date | null;

  @ApiProperty({
    description: 'AI customization configured (greeting, business info, FAQs)',
    example: false
  })
  aiCustomized: boolean;
}

export class FacilityResponseDto {
  @ApiProperty({
    description: 'Unique facility ID',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID this facility belongs to',
    example: 'clx0987654321fedcba',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Facility name',
    example: 'Cancha Los Amigos',
  })
  name: string;

  @ApiProperty({
    description: 'Street address',
    example: 'Av. Corrientes 1234',
  })
  address: string;

  @ApiProperty({
    description: 'City',
    example: 'Buenos Aires',
  })
  city: string;

  @ApiProperty({
    description: 'Country',
    example: 'Argentina',
  })
  country: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+54 11 1234-5678',
  })
  phone: string;

  @ApiProperty({
    description: 'Email address',
    example: 'contacto@canchaslosamigos.com',
  })
  email: string;

  @ApiProperty({
    description: 'Timezone',
    example: 'America/Argentina/Buenos_Aires',
  })
  timezone: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'ARS',
  })
  currencyCode: string;

  @ApiProperty({
    description: 'Deposit percentage',
    example: 50,
  })
  depositPercentage: number;

  @ApiProperty({
    description: 'Cancellation hours for full credit',
    example: 24,
  })
  cancellationHours: number;

  @ApiProperty({
    description: 'Minimum booking notice in hours',
    example: 2,
  })
  minBookingNoticeHours: number;

  @ApiProperty({
    description: 'Maximum advance booking in days',
    example: 30,
  })
  maxBookingAdvanceDays: number;

  @ApiProperty({
    description: 'Buffer minutes between sessions',
    example: 0,
  })
  bufferMinutes: number;

  @ApiProperty({
    description: 'Allowed session durations',
    example: [60, 90],
    type: [Number],
  })
  sessionDurationMinutes: number[];

  @ApiPropertyOptional({
    description: 'WhatsApp phone number',
    example: '+54 11 9876-5432',
  })
  whatsappPhone?: string | null;

  @ApiProperty({
    description: 'Facility status',
    enum: FacilityStatus,
    example: FacilityStatus.ACTIVE,
  })
  status: FacilityStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-02-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-02-01T12:00:00.000Z',
  })
  updatedAt: Date;

  // Aggregated data
  @ApiPropertyOptional({
    description: 'Number of courts at this facility',
    example: 5,
  })
  courtCount?: number;

  @ApiPropertyOptional({
    description: 'Credentials configuration status',
    type: CredentialsStatusDto,
  })
  credentials?: CredentialsStatusDto;
}

export class FacilityListResponseDto {
  @ApiProperty({
    description: 'List of facilities',
    type: [FacilityResponseDto],
  })
  items: FacilityResponseDto[];

  @ApiProperty({
    description: 'Total number of facilities matching the query',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}
