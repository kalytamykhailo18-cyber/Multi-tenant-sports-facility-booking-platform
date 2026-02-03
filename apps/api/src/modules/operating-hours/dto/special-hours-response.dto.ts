// Special Hours Response DTOs
// Response types for special hours endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpecialHoursResponseDto {
  @ApiProperty({
    description: 'Special hours unique identifier',
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
    description: 'The specific date for this exception',
    example: '2026-12-25',
  })
  date: Date;

  @ApiPropertyOptional({
    description: 'Opening time in HH:mm format (null if closed)',
    example: '10:00',
  })
  openTime: string | null;

  @ApiPropertyOptional({
    description: 'Closing time in HH:mm format (null if closed)',
    example: '18:00',
  })
  closeTime: string | null;

  @ApiProperty({
    description: 'Whether the facility is closed on this date',
    example: true,
  })
  isClosed: boolean;

  @ApiPropertyOptional({
    description: 'Reason for the special hours',
    example: 'Feriado - Navidad',
  })
  reason: string | null;

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
    description: 'Formatted date for display (e.g., "25 de Diciembre")',
    example: '25 de Diciembre',
  })
  formattedDate?: string;
}

export class SpecialHoursListResponseDto {
  @ApiProperty({
    description: 'Array of special hours',
    type: [SpecialHoursResponseDto],
  })
  items: SpecialHoursResponseDto[];

  @ApiProperty({
    description: 'Total number of special hours entries',
    example: 10,
  })
  total: number;
}
