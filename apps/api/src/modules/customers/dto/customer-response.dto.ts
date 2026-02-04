// Customer Response DTO
// Types for customer API responses

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReputationLevel } from '@prisma/client';

// Customer summary for list view
export class CustomerSummaryDto {
  @ApiProperty({ description: 'Customer ID', example: 'clx1234567890abcdef' })
  id: string;

  @ApiProperty({ description: 'Customer name', example: 'Juan Pérez' })
  name: string;

  @ApiProperty({ description: 'WhatsApp phone number', example: '+54 11 1234-5678' })
  phone: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'juan@example.com' })
  email?: string;

  @ApiProperty({ description: 'Reputation score (0-100+)', example: 85 })
  reputationScore: number;

  @ApiProperty({ description: 'Reputation level', enum: ReputationLevel, example: ReputationLevel.GOOD })
  reputationLevel: ReputationLevel;

  @ApiProperty({ description: 'Total number of bookings', example: 15 })
  totalBookings: number;

  @ApiProperty({ description: 'Number of no-shows', example: 1 })
  noShowCount: number;

  @ApiProperty({ description: 'Whether customer is blocked', example: false })
  isBlocked: boolean;

  @ApiPropertyOptional({ description: 'Date of last booking', example: '2024-01-15' })
  lastBookingDate?: string;
}

// Customer details for profile view
export class CustomerDetailsDto extends CustomerSummaryDto {
  @ApiProperty({ description: 'Tenant ID', example: 'clx1234567890abcdef' })
  tenantId: string;

  @ApiProperty({ description: 'Number of completed bookings', example: 12 })
  completedBookings: number;

  @ApiProperty({ description: 'Total cancellations', example: 2 })
  cancellationCount: number;

  @ApiProperty({ description: 'Late cancellations (< 24h)', example: 1 })
  lateCancellationCount: number;

  @ApiProperty({ description: 'Credit balance', example: 5000 })
  creditBalance: number;

  @ApiPropertyOptional({ description: 'Internal notes', example: 'Prefers evening slots' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Reason for blocking', example: 'Multiple no-shows' })
  blockedReason?: string;

  @ApiPropertyOptional({ description: 'Preferred court ID', example: 'clx9876543210abcdef' })
  preferredCourtId?: string;

  @ApiPropertyOptional({ description: 'Preferred time slot', example: '20:00' })
  preferredTime?: string;

  @ApiProperty({ description: 'Created date', example: '2024-01-01T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last updated date', example: '2024-01-15T15:30:00Z' })
  updatedAt: string;
}

// Customer note response
export class CustomerNoteDto {
  @ApiProperty({ description: 'Note ID', example: 'clx1234567890abcdef' })
  id: string;

  @ApiProperty({ description: 'Note content', example: 'Called to reschedule booking' })
  content: string;

  @ApiPropertyOptional({ description: 'User who created the note', example: 'María García' })
  createdByName?: string;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T15:30:00Z' })
  createdAt: string;
}

// Reputation history entry
export class ReputationHistoryDto {
  @ApiProperty({ description: 'History entry ID', example: 'clx1234567890abcdef' })
  id: string;

  @ApiProperty({ description: 'Type of change', example: 'COMPLETED' })
  changeType: string;

  @ApiProperty({ description: 'Score change amount', example: 5 })
  changeAmount: number;

  @ApiProperty({ description: 'Score before change', example: 80 })
  previousScore: number;

  @ApiProperty({ description: 'Score after change', example: 85 })
  newScore: number;

  @ApiPropertyOptional({ description: 'Related booking ID' })
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Reason for change', example: 'Completed booking' })
  reason?: string;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T15:30:00Z' })
  createdAt: string;
}

// Paginated customer list response
export class PaginatedCustomersDto {
  @ApiProperty({ description: 'List of customers', type: [CustomerSummaryDto] })
  data: CustomerSummaryDto[];

  @ApiProperty({ description: 'Total number of customers matching filters', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 8 })
  totalPages: number;
}

// Customer details with related data
export class CustomerWithRelationsDto extends CustomerDetailsDto {
  @ApiPropertyOptional({ description: 'Preferred court name', example: 'Cancha 1' })
  preferredCourtName?: string;

  @ApiPropertyOptional({ description: 'Recent notes', type: [CustomerNoteDto] })
  recentNotes?: CustomerNoteDto[];

  @ApiPropertyOptional({ description: 'Reputation history', type: [ReputationHistoryDto] })
  reputationHistory?: ReputationHistoryDto[];
}
