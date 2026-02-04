// Super Admin Dashboard DTOs
// Statistics and overview data for platform monitoring

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Dashboard statistics for Super Admin
 */
export class SuperAdminDashboardDto {
  @ApiProperty({
    description: 'Total number of facilities in the platform',
    example: 15,
  })
  totalFacilities: number;

  @ApiProperty({
    description: 'Number of active subscriptions',
    example: 12,
  })
  activeSubscriptions: number;

  @ApiProperty({
    description: 'Number of suspended subscriptions',
    example: 2,
  })
  suspendedSubscriptions: number;

  @ApiProperty({
    description: 'Number of subscriptions due soon (within 5 days)',
    example: 3,
  })
  dueSoonSubscriptions: number;

  @ApiProperty({
    description: 'Total monthly revenue from all subscriptions (in ARS)',
    example: 150000,
  })
  monthlyRevenue: number;

  @ApiProperty({
    description: 'Facilities with upcoming due dates',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        facilityId: { type: 'string' },
        facilityName: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        daysUntilDue: { type: 'number' },
        monthlyPrice: { type: 'number' },
      },
    },
  })
  facilitiesWithUpcomingDue: {
    facilityId: string;
    facilityName: string;
    dueDate: Date;
    daysUntilDue: number;
    monthlyPrice: number;
  }[];

  @ApiProperty({
    description: 'Number of new facilities this month',
    example: 2,
  })
  newFacilitiesThisMonth: number;

  @ApiProperty({
    description: 'Timestamp of data generation',
    example: '2026-02-04T12:00:00.000Z',
  })
  generatedAt: Date;
}

/**
 * Facility summary for Super Admin list
 */
export class FacilitySummaryDto {
  @ApiProperty({
    description: 'Facility ID',
    example: 'clx1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Facility name',
    example: 'Cancha Los Amigos',
  })
  name: string;

  @ApiProperty({
    description: 'City location',
    example: 'Monte Grande',
  })
  city: string;

  @ApiProperty({
    description: 'Owner name',
    example: 'Juan Pérez',
  })
  ownerName: string;

  @ApiProperty({
    description: 'Owner email',
    example: 'juan@example.com',
  })
  ownerEmail: string;

  @ApiProperty({
    description: 'Number of courts',
    example: 5,
  })
  courtCount: number;

  @ApiProperty({
    description: 'Subscription status',
    enum: ['ACTIVE', 'DUE_SOON', 'SUSPENDED'],
    example: 'ACTIVE',
  })
  subscriptionStatus: string;

  @ApiPropertyOptional({
    description: 'Next due date',
    example: '2026-03-01T00:00:00.000Z',
    nullable: true,
  })
  nextDueDate: Date | null;

  @ApiProperty({
    description: 'Monthly subscription price',
    example: 10000,
  })
  monthlyPrice: number;

  @ApiProperty({
    description: 'WhatsApp connection status',
    example: true,
  })
  whatsappConnected: boolean;

  @ApiProperty({
    description: 'Mercado Pago connection status',
    example: true,
  })
  mercadoPagoConnected: boolean;

  @ApiProperty({
    description: 'Facility creation date',
    example: '2026-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Facility status',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    example: 'ACTIVE',
  })
  status: string;
}

/**
 * Facility list response with pagination
 */
export class FacilityListDto {
  @ApiProperty({
    description: 'List of facilities',
    type: [FacilitySummaryDto],
  })
  items: FacilitySummaryDto[];

  @ApiProperty({
    description: 'Total count',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total pages',
    example: 2,
  })
  totalPages: number;
}

/**
 * Query parameters for facility list
 */
export class FacilityQueryDto {
  @ApiPropertyOptional({
    description: 'Search by facility name or city',
    example: 'Los Amigos',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by subscription status',
    enum: ['ACTIVE', 'DUE_SOON', 'SUSPENDED'],
  })
  subscriptionStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by facility status',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
  })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['name', 'createdAt', 'nextDueDate'],
    default: 'createdAt',
  })
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  sortOrder?: 'asc' | 'desc';
}
