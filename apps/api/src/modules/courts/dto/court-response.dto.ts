// Court Response DTOs
// Response types for court endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourtStatus, SportType } from '@prisma/client';

export class CourtResponseDto {
  @ApiProperty({
    description: 'Court unique identifier',
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
    description: 'Court name',
    example: 'Cancha 1',
  })
  name: string;

  @ApiProperty({
    description: 'Sport type',
    enum: SportType,
    example: SportType.SOCCER,
  })
  sportType: SportType;

  @ApiPropertyOptional({
    description: 'Description of the court',
    example: 'Synthetic grass, covered, with lighting',
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Surface type',
    example: 'synthetic',
  })
  surfaceType: string | null;

  @ApiProperty({
    description: 'Whether the court is indoor',
    example: false,
  })
  isIndoor: boolean;

  @ApiProperty({
    description: 'Base price per hour',
    example: 15000,
  })
  basePricePerHour: number;

  @ApiProperty({
    description: 'Court status',
    enum: CourtStatus,
    example: CourtStatus.ACTIVE,
  })
  status: CourtStatus;

  @ApiProperty({
    description: 'Display order for sorting',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Date when court was created',
    example: '2026-02-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when court was last updated',
    example: '2026-02-01T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Facility name (included in some queries)',
    example: 'Cancha Los Amigos',
  })
  facilityName?: string;

  @ApiPropertyOptional({
    description: 'Facility currency code',
    example: 'ARS',
  })
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Today booking count (for dashboard)',
    example: 5,
  })
  todayBookingsCount?: number;

  @ApiPropertyOptional({
    description: 'Next available slot time',
    example: '14:00',
  })
  nextAvailableSlot?: string;
}

export class CourtListResponseDto {
  @ApiProperty({
    description: 'Array of courts',
    type: [CourtResponseDto],
  })
  items: CourtResponseDto[];

  @ApiProperty({
    description: 'Total number of courts',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 1,
  })
  totalPages: number;
}
