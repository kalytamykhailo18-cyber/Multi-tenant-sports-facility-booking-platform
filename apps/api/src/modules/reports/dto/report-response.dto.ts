// Report Response DTOs
// Response structures for financial reports

import { ApiProperty } from '@nestjs/swagger';

export class RevenueReportDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Deposits collected' })
  deposits: number;

  @ApiProperty({ description: 'Balance payments collected' })
  balancePayments: number;

  @ApiProperty({ description: 'Total refunds issued' })
  refunds: number;

  @ApiProperty({ description: 'Net revenue (revenue - refunds)' })
  netRevenue: number;

  @ApiProperty({ description: 'Number of bookings' })
  bookingCount: number;

  @ApiProperty({ description: 'Number of completed sessions' })
  completedSessions: number;

  @ApiProperty({ description: 'Number of cancellations' })
  cancellations: number;

  @ApiProperty({ description: 'Period (date, week, or month)' })
  period: string;
}

export class CashFlowDto {
  @ApiProperty({ description: 'Money coming in' })
  moneyIn: {
    deposits: number;
    balancePayments: number;
    total: number;
  };

  @ApiProperty({ description: 'Money going out' })
  moneyOut: {
    refunds: number;
    total: number;
  };

  @ApiProperty({ description: 'Net cash flow' })
  netCashFlow: number;

  @ApiProperty({ description: 'Date range' })
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export class ClientDebtDto {
  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Customer phone' })
  customerPhone: string;

  @ApiProperty({ description: 'Total debt amount' })
  debtAmount: number;

  @ApiProperty({ description: 'Number of pending bookings' })
  pendingBookings: number;

  @ApiProperty({ description: 'Oldest pending booking date' })
  oldestBookingDate: string;
}

export class ClientDebtsResponseDto {
  @ApiProperty({ description: 'List of clients with debt', type: [ClientDebtDto] })
  debts: ClientDebtDto[];

  @ApiProperty({ description: 'Total debt across all clients' })
  totalDebt: number;

  @ApiProperty({ description: 'Number of clients with debt' })
  clientCount: number;
}

export class RevenueProjectionDto {
  @ApiProperty({ description: 'Projected revenue from confirmed bookings' })
  confirmedRevenue: number;

  @ApiProperty({ description: 'Projected revenue from pending bookings (with deposit)' })
  pendingRevenue: number;

  @ApiProperty({ description: 'Total projected revenue' })
  totalProjection: number;

  @ApiProperty({ description: 'Number of confirmed bookings' })
  confirmedBookings: number;

  @ApiProperty({ description: 'Number of pending bookings' })
  pendingBookings: number;

  @ApiProperty({ description: 'Projection date range' })
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export class PaymentSummaryDto {
  @ApiProperty({ description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Amount' })
  amount: number;

  @ApiProperty({ description: 'Payment type' })
  type: 'DEPOSIT' | 'BALANCE' | 'REFUND';

  @ApiProperty({ description: 'Status' })
  status: string;

  @ApiProperty({ description: 'Paid at' })
  paidAt?: string;
}

export class PaymentHistoryResponseDto {
  @ApiProperty({ description: 'List of payments', type: [PaymentSummaryDto] })
  payments: PaymentSummaryDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Page number' })
  page: number;

  @ApiProperty({ description: 'Page size' })
  pageSize: number;
}
