// Tenant Response DTO
// Response format for tenant data

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty({
    description: 'Unique tenant ID',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Business name',
    example: 'Canchas Los Amigos',
  })
  businessName: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'canchas-los-amigos',
  })
  slug: string;

  @ApiProperty({
    description: 'Tenant status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

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

  // Aggregated data (optional, included in list views)
  @ApiPropertyOptional({
    description: 'Number of facilities under this tenant',
    example: 1,
  })
  facilityCount?: number;

  @ApiPropertyOptional({
    description: 'Number of users under this tenant',
    example: 3,
  })
  userCount?: number;

  @ApiPropertyOptional({
    description: 'Whether the tenant has an active subscription',
    example: true,
  })
  hasActiveSubscription?: boolean;
}

export class TenantListResponseDto {
  @ApiProperty({
    description: 'List of tenants',
    type: [TenantResponseDto],
  })
  items: TenantResponseDto[];

  @ApiProperty({
    description: 'Total number of tenants matching the query',
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
