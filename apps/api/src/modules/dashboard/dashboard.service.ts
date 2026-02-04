// Dashboard Service
// Aggregates statistics from various sources for the owner dashboard

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardStatsResponseDto, TodayStatsDto, WeekStatsDto, SubscriptionStatsDto } from './dto/dashboard-stats.dto';
import { DashboardAlertsResponseDto, DashboardAlertDto, AlertType, AlertPriority } from './dto/dashboard-alerts.dto';
import { DashboardUpcomingResponseDto, UpcomingBookingDto } from './dto/dashboard-upcoming.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics for a facility
   */
  async getStats(tenantId: string, facilityId?: string): Promise<DashboardStatsResponseDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Get facility info for currency
    const facility = facilityId
      ? await this.prisma.facility.findFirst({
          where: { id: facilityId, tenantId },
        })
      : await this.prisma.facility.findFirst({
          where: { tenantId },
        });

    const currency = facility?.currencyCode || 'ARS';

    // Get court count
    const courtCount = await this.prisma.court.count({
      where: {
        tenantId,
        ...(facilityId && { facilityId }),
        status: 'ACTIVE',
      },
    });

    // Get subscription info
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED'] },
      },
    });

    let subscriptionStats: SubscriptionStatsDto | null = null;
    if (subscription) {
      const daysUntilDue = this.calculateDaysUntilDue(subscription.nextPaymentDate);
      subscriptionStats = {
        status: subscription.status,
        daysUntilDue,
        nextPaymentDate: subscription.nextPaymentDate,
        planName: subscription.planName,
      };
    }

    // Since Booking model doesn't exist yet, return placeholder stats
    // This will be updated when Phase 4 (Booking Calendar System) is implemented
    const todayStats: TodayStatsDto = {
      bookingsCount: 0,
      confirmedCount: 0,
      pendingConfirmationCount: 0,
      expectedRevenue: 0,
      currency,
    };

    const weekStats: WeekStatsDto = {
      bookingsCount: 0,
      revenue: 0,
      currency,
    };

    return {
      today: todayStats,
      week: weekStats,
      cancellationRate: 0,
      pendingEscalations: 0, // Will be implemented with bot module
      subscription: subscriptionStats,
      courtCount,
      activeCustomers: 0, // Will be implemented with customer module
    };
  }

  /**
   * Get dashboard alerts for a facility
   */
  async getAlerts(tenantId: string, facilityId?: string): Promise<DashboardAlertsResponseDto> {
    const alerts: DashboardAlertDto[] = [];

    // Check subscription status
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (subscription) {
      const daysUntilDue = this.calculateDaysUntilDue(subscription.nextPaymentDate);

      // Add subscription reminder alert if due soon or overdue
      if (subscription.status === 'DUE_SOON' || subscription.status === 'OVERDUE') {
        alerts.push({
          id: `subscription-${subscription.id}`,
          type: AlertType.SUBSCRIPTION_REMINDER,
          priority: subscription.status === 'OVERDUE' ? AlertPriority.URGENT : AlertPriority.HIGH,
          title: subscription.status === 'OVERDUE'
            ? 'Pago de suscripción vencido'
            : 'Pago de suscripción próximo a vencer',
          description: subscription.status === 'OVERDUE'
            ? `Tu suscripción está vencida. Realiza el pago para evitar la suspensión del servicio.`
            : `Tu suscripción vence en ${daysUntilDue} días. Realiza el pago para continuar usando el servicio.`,
          entityId: subscription.id,
          entityType: 'SUBSCRIPTION',
          createdAt: new Date(),
          actionLink: '/subscription',
        });
      }

      if (subscription.status === 'SUSPENDED') {
        alerts.push({
          id: `subscription-suspended-${subscription.id}`,
          type: AlertType.SUBSCRIPTION_REMINDER,
          priority: AlertPriority.URGENT,
          title: 'Servicio suspendido',
          description: 'Tu servicio está suspendido por falta de pago. Realiza el pago para reactivar.',
          entityId: subscription.id,
          entityType: 'SUBSCRIPTION',
          createdAt: new Date(),
          actionLink: '/subscription',
        });
      }
    }

    // Future: Add booking-related alerts when booking module is implemented
    // - Unconfirmed bookings for today
    // - Pending AI escalations
    // - Payment issues

    // Sort alerts by priority (URGENT first, then HIGH, MEDIUM, LOW)
    const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      alerts,
      total: alerts.length,
    };
  }

  /**
   * Get upcoming bookings for a facility
   */
  async getUpcoming(
    tenantId: string,
    facilityId?: string,
    limit: number = 5,
  ): Promise<DashboardUpcomingResponseDto> {
    // Since Booking model doesn't exist yet, return empty array
    // This will be updated when Phase 4 (Booking Calendar System) is implemented
    const bookings: UpcomingBookingDto[] = [];

    return {
      bookings,
      total: 0,
    };
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Calculate days until payment is due
   */
  private calculateDaysUntilDue(nextPaymentDate: Date): number {
    const now = new Date();
    const diffTime = nextPaymentDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get start of day in UTC
   */
  private getStartOfDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get end of day in UTC
   */
  private getEndOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Get start of week (Sunday) in UTC
   */
  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get end of week (Saturday) in UTC
   */
  private getEndOfWeek(date: Date): Date {
    const start = this.getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
