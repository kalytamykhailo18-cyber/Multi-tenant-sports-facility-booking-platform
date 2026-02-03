// Dashboard Stats DTO
// Response DTO for dashboard statistics

import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class TodayStatsDto {
  @ApiProperty({ description: 'Total bookings for today' })
  bookingsCount: number;

  @ApiProperty({ description: 'Confirmed bookings for today' })
  confirmedCount: number;

  @ApiProperty({ description: 'Pending confirmation bookings for today' })
  pendingConfirmationCount: number;

  @ApiProperty({ description: 'Expected revenue for today' })
  expectedRevenue: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

export class WeekStatsDto {
  @ApiProperty({ description: 'Total bookings for this week' })
  bookingsCount: number;

  @ApiProperty({ description: 'Total revenue for this week' })
  revenue: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

export class SubscriptionStatsDto {
  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Days until payment is due' })
  daysUntilDue: number;

  @ApiProperty({ description: 'Next payment date' })
  nextPaymentDate: Date;

  @ApiProperty({ description: 'Plan name' })
  planName: string;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ type: TodayStatsDto })
  today: TodayStatsDto;

  @ApiProperty({ type: WeekStatsDto })
  week: WeekStatsDto;

  @ApiProperty({ description: 'Cancellation rate percentage for the last 30 days' })
  cancellationRate: number;

  @ApiProperty({ description: 'Pending AI escalations count' })
  pendingEscalations: number;

  @ApiProperty({ type: SubscriptionStatsDto, nullable: true })
  subscription: SubscriptionStatsDto | null;

  @ApiProperty({ description: 'Number of courts/fields' })
  courtCount: number;

  @ApiProperty({ description: 'Number of active customers' })
  activeCustomers: number;
}
