// Super Admin Service
// Business logic for platform-wide monitoring and facility management

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SuperAdminDashboardDto,
  FacilitySummaryDto,
  FacilityListDto,
  FacilityQueryDto,
} from './dto/dashboard.dto';
import { Prisma, Subscription } from '@sports-booking/database';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get active subscription for a tenant
   * Returns the first ACTIVE subscription or the most recent one
   */
  private getActiveSubscription(
    subscriptions: Subscription[],
  ): Subscription | null {
    // First try to find an ACTIVE subscription
    const activeSubscription = subscriptions.find(
      (sub) => sub.status === 'ACTIVE',
    );
    if (activeSubscription) return activeSubscription;

    // If no ACTIVE, return the most recent one
    if (subscriptions.length > 0) {
      return subscriptions.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];
    }

    return null;
  }

  /**
   * Get dashboard statistics for Super Admin
   * Calculates platform-wide metrics and upcoming due dates
   */
  async getDashboardStats(): Promise<SuperAdminDashboardDto> {
    this.logger.log('Calculating Super Admin dashboard statistics');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    // Get all facilities with their subscription info
    const facilities = await this.prisma.facility.findMany({
      include: {
        tenant: {
          include: {
            subscriptions: true,
            users: {
              where: { role: 'OWNER' },
              take: 1,
            },
          },
        },
        courts: true,
      },
    });

    // Calculate statistics
    const totalFacilities = facilities.length;

    const activeSubscriptions = facilities.filter((f) => {
      const subscription = this.getActiveSubscription(f.tenant.subscriptions);
      return subscription?.status === 'ACTIVE';
    }).length;

    const suspendedSubscriptions = facilities.filter((f) => {
      const subscription = this.getActiveSubscription(f.tenant.subscriptions);
      return subscription?.status === 'SUSPENDED';
    }).length;

    const dueSoonSubscriptions = facilities.filter((f) => {
      const subscription = this.getActiveSubscription(f.tenant.subscriptions);
      const nextDue = subscription?.nextPaymentDate;
      return nextDue && nextDue <= fiveDaysFromNow && nextDue >= now;
    }).length;

    // Calculate monthly revenue from active subscriptions
    const monthlyRevenue = facilities.reduce((sum, facility) => {
      const subscription = this.getActiveSubscription(
        facility.tenant.subscriptions,
      );
      if (subscription?.status === 'ACTIVE') {
        return sum + Number(subscription.priceAmount || 0);
      }
      return sum;
    }, 0);

    // Get facilities with upcoming due dates (next 5 days)
    const facilitiesWithUpcomingDue = facilities
      .filter((f) => {
        const subscription = this.getActiveSubscription(
          f.tenant.subscriptions,
        );
        const nextDue = subscription?.nextPaymentDate;
        return nextDue && nextDue <= fiveDaysFromNow && nextDue >= now;
      })
      .map((f) => {
        const subscription = this.getActiveSubscription(
          f.tenant.subscriptions,
        )!;
        const nextDue = subscription.nextPaymentDate!;
        const daysUntilDue = Math.ceil(
          (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          facilityId: f.id,
          facilityName: f.name,
          dueDate: nextDue,
          daysUntilDue,
          monthlyPrice: Number(subscription.priceAmount || 0),
        };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Count new facilities this month
    const newFacilitiesThisMonth = facilities.filter(
      (f) => f.createdAt >= startOfMonth,
    ).length;

    return {
      totalFacilities,
      activeSubscriptions,
      suspendedSubscriptions,
      dueSoonSubscriptions,
      monthlyRevenue,
      facilitiesWithUpcomingDue,
      newFacilitiesThisMonth,
      generatedAt: new Date(),
    };
  }

  /**
   * Get all facilities with search, filter, and pagination
   * @param query - Query parameters for search/filter/pagination
   */
  async getAllFacilities(query: FacilityQueryDto): Promise<FacilityListDto> {
    const {
      search,
      subscriptionStatus,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    this.logger.log(
      `Fetching facilities list: page=${page}, limit=${limit}, search=${search}`,
    );

    // Build where clause
    const where: Prisma.FacilityWhereInput = {};

    // Search by name or city
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by facility status
    if (status) {
      where.status = status as any;
    }

    // Filter by subscription status
    if (subscriptionStatus) {
      where.tenant = {
        subscriptions: {
          some: {
            status: subscriptionStatus as any,
          },
        },
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.FacilityOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'nextDueDate') {
      // For sorting by subscription date, we'll handle it after fetching
      orderBy.createdAt = sortOrder; // Default fallback
    }

    // Get total count
    const total = await this.prisma.facility.count({ where });

    // Get paginated facilities
    const facilities = await this.prisma.facility.findMany({
      where,
      include: {
        tenant: {
          include: {
            subscriptions: true,
            users: {
              where: { role: 'OWNER' },
              take: 1,
            },
          },
        },
        courts: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map to DTOs
    const items: FacilitySummaryDto[] = facilities.map((facility) => {
      const now = new Date();
      const subscription = this.getActiveSubscription(
        facility.tenant.subscriptions,
      );
      const nextDueDate = subscription?.nextPaymentDate || null;
      const owner = facility.tenant.users[0];

      // Determine subscription status
      let subscriptionStatus = 'ACTIVE';
      if (subscription?.status === 'SUSPENDED') {
        subscriptionStatus = 'SUSPENDED';
      } else if (
        nextDueDate &&
        nextDueDate <= new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      ) {
        subscriptionStatus = 'DUE_SOON';
      }

      return {
        id: facility.id,
        name: facility.name,
        city: facility.city,
        ownerName: owner?.fullName || 'N/A',
        ownerEmail: owner?.email || 'N/A',
        courtCount: facility.courts.length,
        subscriptionStatus,
        nextDueDate,
        monthlyPrice: Number(subscription?.priceAmount || 0),
        whatsappConnected: facility.whatsappConnected || false,
        mercadoPagoConnected: facility.mpConnected || false,
        createdAt: facility.createdAt,
        status: facility.status,
      };
    });

    // Sort by nextDueDate if requested (after mapping)
    if (sortBy === 'nextDueDate') {
      items.sort((a, b) => {
        const dateA = a.nextDueDate?.getTime() || 0;
        const dateB = b.nextDueDate?.getTime() || 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get detailed facility information
   * @param id - Facility ID
   */
  async getFacilityDetails(id: string): Promise<FacilitySummaryDto> {
    this.logger.log(`Fetching facility details: ${id}`);

    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        tenant: {
          include: {
            subscriptions: true,
            users: {
              where: { role: 'OWNER' },
              take: 1,
            },
          },
        },
        courts: true,
      },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${id} not found`);
    }

    const now = new Date();
    const subscription = this.getActiveSubscription(
      facility.tenant.subscriptions,
    );
    const nextDueDate = subscription?.nextPaymentDate || null;
    const owner = facility.tenant.users[0];

    // Determine subscription status
    let subscriptionStatus = 'ACTIVE';
    if (subscription?.status === 'SUSPENDED') {
      subscriptionStatus = 'SUSPENDED';
    } else if (
      nextDueDate &&
      nextDueDate <= new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
    ) {
      subscriptionStatus = 'DUE_SOON';
    }

    return {
      id: facility.id,
      name: facility.name,
      city: facility.city,
      ownerName: owner?.fullName || 'N/A',
      ownerEmail: owner?.email || 'N/A',
      courtCount: facility.courts.length,
      subscriptionStatus,
      nextDueDate,
      monthlyPrice: Number(subscription?.priceAmount || 0),
      whatsappConnected: facility.whatsappConnected || false,
      mercadoPagoConnected: facility.mpConnected || false,
      createdAt: facility.createdAt,
      status: facility.status,
    };
  }
}
