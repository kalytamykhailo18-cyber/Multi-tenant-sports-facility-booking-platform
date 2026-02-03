// Dashboard Upcoming DTO
// Response DTO for upcoming bookings

import { ApiProperty } from '@nestjs/swagger';

export class UpcomingBookingDto {
  @ApiProperty({ description: 'Booking ID' })
  id: string;

  @ApiProperty({ description: 'Booking date' })
  date: Date;

  @ApiProperty({ description: 'Start time' })
  startTime: string;

  @ApiProperty({ description: 'End time' })
  endTime: string;

  @ApiProperty({ description: 'Duration in minutes' })
  durationMinutes: number;

  @ApiProperty({ description: 'Court/field name' })
  courtName: string;

  @ApiProperty({ description: 'Court ID' })
  courtId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer phone' })
  customerPhone: string;

  @ApiProperty({ description: 'Booking status' })
  status: string;

  @ApiProperty({ description: 'Is deposit paid' })
  depositPaid: boolean;

  @ApiProperty({ description: 'Is confirmed for today' })
  isConfirmed: boolean;

  @ApiProperty({ description: 'Total price' })
  totalPrice: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;
}

export class DashboardUpcomingResponseDto {
  @ApiProperty({ type: [UpcomingBookingDto] })
  bookings: UpcomingBookingDto[];

  @ApiProperty({ description: 'Total count of upcoming bookings' })
  total: number;
}
