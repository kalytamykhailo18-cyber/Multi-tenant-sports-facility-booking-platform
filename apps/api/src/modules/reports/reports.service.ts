// Reports Service
// Financial reporting and analytics

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RevenueReportDto,
  CashFlowDto,
  ClientDebtsResponseDto,
  RevenueProjectionDto,
  PaymentHistoryResponseDto,
  ClientDebtDto,
  PaymentSummaryDto,
} from './dto/report-response.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get daily revenue report for a facility
   */
  async getDailyRevenue(
    tenantId: string,
    facilityId: string,
    date: Date,
  ): Promise<RevenueReportDto> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.calculateRevenue(tenantId, facilityId, startOfDay, endOfDay, date.toISOString().split('T')[0]);
  }

  /**
   * Get weekly revenue report
   */
  async getWeeklyRevenue(
    tenantId: string,
    facilityId: string,
    weekStart: Date,
  ): Promise<RevenueReportDto> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const period = `Week of ${weekStart.toISOString().split('T')[0]}`;
    return this.calculateRevenue(tenantId, facilityId, weekStart, weekEnd, period);
  }

  /**
   * Get monthly revenue report
   */
  async getMonthlyRevenue(
    tenantId: string,
    facilityId: string,
    month: string, // Format: YYYY-MM
  ): Promise<RevenueReportDto> {
    const [year, monthNum] = month.split('-').map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59, 999);

    return this.calculateRevenue(tenantId, facilityId, startOfMonth, endOfMonth, month);
  }

  /**
   * Calculate revenue for a date range
   */
  private async calculateRevenue(
    tenantId: string,
    facilityId: string,
    startDate: Date,
    endDate: Date,
    period: string,
  ): Promise<RevenueReportDto> {
    // Get all bookings in the date range
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        facilityId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        totalPrice: true,
        depositAmount: true,
        balanceAmount: true,
        depositPaid: true,
        balancePaid: true,
        status: true,
      },
    });

    // Get all payments (refunds) in the date range
    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        bookingId: {
          in: bookings.map((b) => b.id),
        },
        status: 'REFUNDED',
      },
      select: {
        refundedAmount: true,
      },
    });

    // Calculate totals
    let deposits = 0;
    let balancePayments = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    bookings.forEach((booking) => {
      if (booking.depositPaid) {
        deposits += Number(booking.depositAmount);
      }
      if (booking.balancePaid) {
        balancePayments += Number(booking.balanceAmount);
      }
      if (booking.status === 'COMPLETED') {
        completedCount++;
      }
      if (booking.status === 'CANCELLED') {
        cancelledCount++;
      }
    });

    const refunds = payments.reduce((sum, p) => sum + Number(p.refundedAmount || 0), 0);
    const totalRevenue = deposits + balancePayments;
    const netRevenue = totalRevenue - refunds;

    return {
      totalRevenue,
      deposits,
      balancePayments,
      refunds,
      netRevenue,
      bookingCount: bookings.length,
      completedSessions: completedCount,
      cancellations: cancelledCount,
      period,
    };
  }

  /**
   * Get cash flow report
   */
  async getCashFlow(
    tenantId: string,
    facilityId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CashFlowDto> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        facilityId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        depositAmount: true,
        balanceAmount: true,
        depositPaid: true,
        balancePaid: true,
      },
    });

    const payments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        bookingId: {
          in: bookings.map((b) => b.id),
        },
        status: 'REFUNDED',
      },
      select: {
        refundedAmount: true,
      },
    });

    let deposits = 0;
    let balancePayments = 0;

    bookings.forEach((booking) => {
      if (booking.depositPaid) deposits += Number(booking.depositAmount);
      if (booking.balancePaid) balancePayments += Number(booking.balanceAmount);
    });

    const refunds = payments.reduce((sum, p) => sum + Number(p.refundedAmount || 0), 0);

    return {
      moneyIn: {
        deposits,
        balancePayments,
        total: deposits + balancePayments,
      },
      moneyOut: {
        refunds,
        total: refunds,
      },
      netCashFlow: deposits + balancePayments - refunds,
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Get clients with outstanding debts (unpaid balances)
   */
  async getClientDebts(tenantId: string, facilityId: string): Promise<ClientDebtsResponseDto> {
    // Get bookings with unpaid balances (past sessions)
    const now = new Date();

    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        facilityId,
        date: {
          lt: now, // Past bookings only
        },
        balancePaid: false,
        status: {
          in: ['COMPLETED', 'CONFIRMED', 'PAID'],
        },
      },
      select: {
        id: true,
        date: true,
        customerName: true,
        customerPhone: true,
        balanceAmount: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by customer phone (unique identifier)
    const debtsByCustomer = new Map<string, ClientDebtDto>();

    bookings.forEach((booking) => {
      const existing = debtsByCustomer.get(booking.customerPhone);

      if (existing) {
        existing.debtAmount += Number(booking.balanceAmount);
        existing.pendingBookings += 1;
        // Update oldest date if this booking is older
        if (booking.date < new Date(existing.oldestBookingDate)) {
          existing.oldestBookingDate = booking.date.toISOString();
        }
      } else {
        debtsByCustomer.set(booking.customerPhone, {
          customerId: booking.customerPhone, // Using phone as ID since we don't have customerId yet
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          debtAmount: Number(booking.balanceAmount),
          pendingBookings: 1,
          oldestBookingDate: booking.date.toISOString(),
        });
      }
    });

    const debts = Array.from(debtsByCustomer.values());
    const totalDebt = debts.reduce((sum, d) => sum + d.debtAmount, 0);

    return {
      debts,
      totalDebt,
      clientCount: debts.length,
    };
  }

  /**
   * Get revenue projections from future bookings
   */
  async getRevenueProjections(
    tenantId: string,
    facilityId: string,
    daysAhead: number = 30,
  ): Promise<RevenueProjectionDto> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const bookings = await this.prisma.booking.findMany({
      where: {
        tenantId,
        facilityId,
        date: {
          gte: now,
          lte: futureDate,
        },
        status: {
          in: ['CONFIRMED', 'PAID', 'RESERVED'],
        },
      },
      select: {
        totalPrice: true,
        status: true,
      },
    });

    let confirmedRevenue = 0;
    let pendingRevenue = 0;
    let confirmedCount = 0;
    let pendingCount = 0;

    bookings.forEach((booking) => {
      const amount = Number(booking.totalPrice);
      if (booking.status === 'CONFIRMED' || booking.status === 'PAID') {
        confirmedRevenue += amount;
        confirmedCount++;
      } else {
        pendingRevenue += amount;
        pendingCount++;
      }
    });

    return {
      confirmedRevenue,
      pendingRevenue,
      totalProjection: confirmedRevenue + pendingRevenue,
      confirmedBookings: confirmedCount,
      pendingBookings: pendingCount,
      dateRange: {
        startDate: now.toISOString().split('T')[0],
        endDate: futureDate.toISOString().split('T')[0],
      },
    };
  }

  /**
   * Get payment history with pagination
   */
  async getPaymentHistory(
    tenantId: string,
    facilityId: string,
    page: number = 1,
    pageSize: number = 50,
  ): Promise<PaymentHistoryResponseDto> {
    const skip = (page - 1) * pageSize;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          tenantId,
          facilityId,
        },
        select: {
          id: true,
          date: true,
          customerName: true,
          depositAmount: true,
          balanceAmount: true,
          depositPaid: true,
          depositPaidAt: true,
          balancePaid: true,
          balancePaidAt: true,
          status: true,
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.booking.count({
        where: {
          tenantId,
          facilityId,
        },
      }),
    ]);

    const payments: PaymentSummaryDto[] = [];

    bookings.forEach((booking) => {
      if (booking.depositPaid) {
        payments.push({
          bookingId: booking.id,
          date: booking.date.toISOString().split('T')[0],
          customerName: booking.customerName,
          amount: Number(booking.depositAmount),
          type: 'DEPOSIT',
          status: 'PAID',
          paidAt: booking.depositPaidAt?.toISOString(),
        });
      }
      if (booking.balancePaid) {
        payments.push({
          bookingId: booking.id,
          date: booking.date.toISOString().split('T')[0],
          customerName: booking.customerName,
          amount: Number(booking.balanceAmount),
          type: 'BALANCE',
          status: 'PAID',
          paidAt: booking.balancePaidAt?.toISOString(),
        });
      }
    });

    return {
      payments,
      total,
      page,
      pageSize,
    };
  }
}
