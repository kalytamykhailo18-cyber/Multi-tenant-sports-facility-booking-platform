// Subscriptions Service
// Full subscription management operations with status logic

import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEventType, AuditEventCategory } from '../../common/audit/audit.types';
import { WsGateway } from '../../common/gateway/ws.gateway';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { QuerySubscriptionDto } from './dto/query-subscription.dto';
import { SubscriptionResponseDto, SubscriptionListResponseDto } from './dto/subscription-response.dto';
import { Subscription, SubscriptionStatus, Prisma } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
  ) {}

  /**
   * Generate Mercado Pago payment link for subscription renewal
   * (To be implemented with PaymentsService integration)
   */
  async generateSubscriptionPaymentLink(tenantId: string): Promise<{ paymentLink: string; preferenceId: string }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`No subscription found for tenant ${tenantId}`);
    }

    // TODO: Integrate with PaymentsService to create MP preference
    // For now, return a placeholder
    // In full implementation, this would call PaymentsService.createPreference()
    // with subscription-specific metadata

    this.logger.log(`Generated payment link for subscription: ${subscription.id}`);

    return {
      paymentLink: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=PLACEHOLDER`,
      preferenceId: 'PLACEHOLDER',
    };
  }

  /**
   * Create a new subscription for a tenant
   */
  async create(dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    const {
      tenantId,
      planName = 'Standard',
      priceAmount,
      currency = 'ARS',
      billingCycle = 'MONTHLY',
      dueSoonDays = 5,
      startDate,
    } = dto;

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    // Check if tenant already has an active subscription
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (existingSubscription) {
      throw new ConflictException('Tenant already has an active subscription');
    }

    // Calculate period dates
    const now = startDate ? new Date(startDate) : new Date();
    const periodEnd = this.calculatePeriodEnd(now, billingCycle);

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        planName,
        priceAmount,
        currency,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        status: 'ACTIVE',
        nextPaymentDate: periodEnd,
        dueSoonDays,
      },
      include: {
        tenant: true,
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.SUBSCRIPTION,
      eventType: AuditEventType.SUBSCRIPTION_CREATED,
      tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Subscription created for tenant: ${tenant.businessName}`,
      entity: { type: 'SUBSCRIPTION', id: subscription.id },
      metadata: { planName, priceAmount, currency },
    });

    this.logger.log(`Subscription created for tenant: ${tenant.businessName} (${subscription.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, 'subscription:created', {
      id: subscription.id,
      status: subscription.status,
    });

    return this.toResponseDto(subscription, tenant.businessName);
  }

  /**
   * Find all subscriptions with pagination and filtering
   */
  async findAll(query: QuerySubscriptionDto): Promise<SubscriptionListResponseDto> {
    const {
      page = 1,
      limit = 10,
      status,
      tenantId,
      sortBy = 'nextPaymentDate',
      sortOrder = 'asc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SubscriptionWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Execute queries in parallel
    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tenant: {
            select: {
              businessName: true,
            },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    // Map to response DTOs
    const items: SubscriptionResponseDto[] = subscriptions.map((sub) =>
      this.toResponseDto(sub, sub.tenant.businessName),
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find subscription by ID
   */
  async findById(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return this.toResponseDto(subscription, subscription.tenant.businessName);
  }

  /**
   * Find subscription by tenant ID
   */
  async findByTenantId(tenantId: string): Promise<SubscriptionResponseDto | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED'] },
      },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (!subscription) {
      return null;
    }

    return this.toResponseDto(subscription, subscription.tenant.businessName);
  }

  /**
   * Update a subscription
   */
  async update(id: string, dto: UpdateSubscriptionDto): Promise<SubscriptionResponseDto> {
    // Verify subscription exists
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Update subscription
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...(dto.planName !== undefined && { planName: dto.planName }),
        ...(dto.priceAmount !== undefined && { priceAmount: dto.priceAmount }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.billingCycle !== undefined && { billingCycle: dto.billingCycle }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.dueSoonDays !== undefined && { dueSoonDays: dto.dueSoonDays }),
      },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.SUBSCRIPTION,
      eventType: AuditEventType.SUBSCRIPTION_RENEWED,
      tenantId: subscription.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Subscription updated for tenant: ${subscription.tenant.businessName}`,
      entity: { type: 'SUBSCRIPTION', id: subscription.id },
      metadata: { changes: dto },
    });

    this.logger.log(`Subscription updated: ${subscription.id}`);

    // Emit socket event
    this.wsGateway.emitToTenant(subscription.tenantId, 'subscription:updated', {
      id: subscription.id,
      status: subscription.status,
    });

    return this.toResponseDto(subscription, subscription.tenant.businessName);
  }

  /**
   * Process payment received - renews subscription for 30 days
   */
  async processPayment(
    tenantId: string,
    paymentAmount: number,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`No subscription found for tenant ${tenantId}`);
    }

    const now = new Date();
    const newPeriodEnd = this.addDays(now, 30);

    // Update subscription to ACTIVE and renew for 30 days
    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
        nextPaymentDate: newPeriodEnd,
        lastPaymentDate: now,
        lastPaymentAmount: paymentAmount,
      },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Also reactivate tenant if suspended
    if (subscription.tenant.status === 'SUSPENDED') {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE' },
      });
    }

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.SUBSCRIPTION,
      eventType: AuditEventType.SUBSCRIPTION_RENEWED,
      tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Subscription renewed after payment: ${updated.tenant.businessName}`,
      entity: { type: 'SUBSCRIPTION', id: updated.id },
      metadata: { paymentAmount, newPeriodEnd: newPeriodEnd.toISOString() },
    });

    this.logger.log(`Subscription renewed for tenant: ${tenantId}`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, 'subscription:renewed', {
      id: updated.id,
      status: updated.status,
      nextPaymentDate: updated.nextPaymentDate,
    });

    return this.toResponseDto(updated, updated.tenant.businessName);
  }

  /**
   * Suspend a subscription (and tenant)
   */
  async suspend(id: string, reason?: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    if (subscription.status === 'SUSPENDED') {
      throw new BadRequestException('Subscription is already suspended');
    }

    // Update subscription status
    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Also suspend the tenant
    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { status: 'SUSPENDED' },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.SUBSCRIPTION,
      eventType: AuditEventType.SUBSCRIPTION_SUSPENDED,
      tenantId: subscription.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Subscription suspended: ${updated.tenant.businessName}`,
      entity: { type: 'SUBSCRIPTION', id: subscription.id },
      metadata: { reason: reason || 'Payment overdue' },
    });

    this.logger.log(`Subscription suspended: ${subscription.id}`);

    // Emit socket event
    this.wsGateway.emitToTenant(subscription.tenantId, 'subscription:suspended', {
      id: subscription.id,
      reason: reason || 'Payment overdue',
    });

    return this.toResponseDto(updated, updated.tenant.businessName);
  }

  /**
   * Reactivate a suspended subscription
   */
  async reactivate(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    if (subscription.status === 'ACTIVE') {
      throw new BadRequestException('Subscription is already active');
    }

    // Update subscription status and extend for 30 days
    const now = new Date();
    const newPeriodEnd = this.addDays(now, 30);

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: newPeriodEnd,
        nextPaymentDate: newPeriodEnd,
      },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Also reactivate the tenant
    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { status: 'ACTIVE' },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.SUBSCRIPTION,
      eventType: AuditEventType.SUBSCRIPTION_REACTIVATED,
      tenantId: subscription.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Subscription reactivated: ${updated.tenant.businessName}`,
      entity: { type: 'SUBSCRIPTION', id: subscription.id },
    });

    this.logger.log(`Subscription reactivated: ${subscription.id}`);

    // Emit socket event
    this.wsGateway.emitToTenant(subscription.tenantId, 'subscription:reactivated', {
      id: subscription.id,
      status: updated.status,
    });

    return this.toResponseDto(updated, updated.tenant.businessName);
  }

  /**
   * Cancel a subscription
   */
  async cancel(id: string, reason?: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Update subscription status
    const updated = await this.prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        tenant: {
          select: {
            businessName: true,
          },
        },
      },
    });

    // Also cancel/suspend the tenant
    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { status: 'CANCELLED' },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.SUBSCRIPTION,
      eventType: AuditEventType.SUBSCRIPTION_CANCELLED,
      tenantId: subscription.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Subscription cancelled: ${updated.tenant.businessName}`,
      entity: { type: 'SUBSCRIPTION', id: subscription.id },
      metadata: { reason: reason || 'Not specified' },
    });

    this.logger.log(`Subscription cancelled: ${subscription.id}`);

    return this.toResponseDto(updated, updated.tenant.businessName);
  }

  /**
   * Check and update subscription statuses (called by scheduled job)
   */
  /**
   * Cron job that runs daily at 6 AM to check subscription statuses
   * - Updates to DUE_SOON when within dueSoonDays window
   * - Auto-suspends when payment is overdue
   */
  @Cron('0 6 * * *', {
    name: 'check-subscription-statuses',
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  async checkAndUpdateStatuses(): Promise<{ updated: number; suspended: number }> {
    this.logger.log('🔍 Checking subscription statuses...');

    let updatedCount = 0;
    let suspendedCount = 0;

    // Get all active/due_soon subscriptions
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: { in: ['ACTIVE', 'DUE_SOON', 'OVERDUE'] },
      },
      include: { tenant: true },
    });

    for (const subscription of subscriptions) {
      const daysUntilDue = this.calculateDaysUntilDue(subscription.nextPaymentDate);

      // Determine new status based on days until due
      if (daysUntilDue <= 0) {
        // Payment due date reached - SUSPEND IMMEDIATELY
        suspendedCount++;

        // Suspend both subscription and tenant
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'SUSPENDED' },
        });

        await this.prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: { status: 'SUSPENDED' },
        });

        // Log audit
        this.auditService.log({
          category: AuditEventCategory.SUBSCRIPTION,
          eventType: AuditEventType.SUBSCRIPTION_SUSPENDED,
          tenantId: subscription.tenantId,
          actor: { type: 'SYSTEM', id: null },
          action: `Subscription auto-suspended (payment overdue): ${subscription.tenant.businessName}`,
          entity: { type: 'SUBSCRIPTION', id: subscription.id },
        });

        // Emit socket event
        this.wsGateway.emitToTenant(subscription.tenantId, 'subscription:suspended', {
          id: subscription.id,
          reason: 'Payment overdue - auto-suspended',
        });
      } else if (daysUntilDue <= subscription.dueSoonDays && subscription.status === 'ACTIVE') {
        // Within due soon window - update to DUE_SOON
        updatedCount++;

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'DUE_SOON' },
        });

        // Log audit
        this.auditService.log({
          category: AuditEventCategory.SUBSCRIPTION,
          eventType: AuditEventType.SUBSCRIPTION_REMINDER_SENT,
          tenantId: subscription.tenantId,
          actor: { type: 'SYSTEM', id: null },
          action: `Subscription status changed to DUE_SOON: ${subscription.tenant.businessName}`,
          entity: { type: 'SUBSCRIPTION', id: subscription.id },
          metadata: { daysUntilDue },
        });
      }
    }

    this.logger.log(`Subscription status check complete: ${updatedCount} updated to DUE_SOON, ${suspendedCount} suspended`);

    return { updated: updatedCount, suspended: suspendedCount };
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  /**
   * Convert subscription to response DTO
   */
  private toResponseDto(
    subscription: Subscription,
    tenantName?: string,
  ): SubscriptionResponseDto {
    return {
      id: subscription.id,
      tenantId: subscription.tenantId,
      planName: subscription.planName,
      priceAmount: Number(subscription.priceAmount),
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      status: subscription.status,
      nextPaymentDate: subscription.nextPaymentDate,
      lastPaymentDate: subscription.lastPaymentDate,
      lastPaymentAmount: subscription.lastPaymentAmount ? Number(subscription.lastPaymentAmount) : null,
      dueSoonDays: subscription.dueSoonDays,
      daysUntilDue: this.calculateDaysUntilDue(subscription.nextPaymentDate),
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      tenantName,
    };
  }

  /**
   * Calculate days until payment is due
   */
  private calculateDaysUntilDue(nextPaymentDate: Date): number {
    const now = new Date();
    const diffTime = nextPaymentDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate period end based on billing cycle
   */
  private calculatePeriodEnd(startDate: Date, billingCycle: string): Date {
    const endDate = new Date(startDate);
    if (billingCycle === 'MONTHLY') {
      endDate.setDate(endDate.getDate() + 30);
    } else if (billingCycle === 'YEARLY') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    return endDate;
  }

  /**
   * Add days to a date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
