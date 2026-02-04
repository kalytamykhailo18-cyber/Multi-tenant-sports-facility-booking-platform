// Credits Service
// Credit management operations for customer refunds and deposits

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEventType, AuditEventCategory } from '../../common/audit/audit.types';
import { WsGateway } from '../../common/gateway/ws.gateway';
import { CreateCreditDto } from './dto/create-credit.dto';
import { QueryCreditDto } from './dto/query-credit.dto';
import { CreditResponseDto, CreditListResponseDto, CustomerCreditBalanceDto, ApplyCreditResultDto } from './dto/credit-response.dto';
import { UseCreditDto } from './dto/use-credit.dto';
import { Credit, CreditReason, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
  ) {}

  /**
   * Create a new credit for a customer
   */
  async create(dto: CreateCreditDto): Promise<CreditResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const userId = this.tenantContext.getUserId();

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot create credit for customer from another tenant');
    }

    // Create credit
    const credit = await this.prisma.credit.create({
      data: {
        tenantId,
        customerId: dto.customerId,
        originalAmount: new Decimal(dto.amount),
        remainingAmount: new Decimal(dto.amount),
        currency: dto.currency || 'ARS',
        reason: dto.reason,
        sourceBookingId: dto.sourceBookingId,
        sourcePaymentId: dto.sourcePaymentId,
        description: dto.description,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById: userId,
        usedInBookingIds: [],
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_CREDIT_ADDED,
      tenantId,
      actor: { type: 'USER', id: userId },
      action: `Credit created for customer ${dto.customerId}`,
      entity: { type: 'CREDIT', id: credit.id },
      metadata: {
        customerId: dto.customerId,
        amount: dto.amount,
        reason: dto.reason,
      },
    });

    // Emit WebSocket event
    this.wsGateway.emitToTenant(tenantId, 'credit:created', {
      id: credit.id,
      customerId: credit.customerId,
      amount: Number(credit.originalAmount),
    });

    this.logger.log(`Credit created: ${credit.id} for customer ${dto.customerId}, amount: ${dto.amount}`);

    return this.toResponseDto(credit);
  }

  /**
   * Get credit by ID
   */
  async findById(id: string): Promise<CreditResponseDto> {
    const credit = await this.prisma.credit.findUnique({
      where: { id },
    });

    if (!credit) {
      throw new NotFoundException(`Credit with ID ${id} not found`);
    }

    // Check tenant access
    const tenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && tenantId !== credit.tenantId) {
      throw new ForbiddenException('Cannot access this credit');
    }

    return this.toResponseDto(credit);
  }

  /**
   * List credits with filtering
   */
  async findAll(query: QueryCreditDto): Promise<CreditListResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const {
      customerId,
      reason,
      sourceBookingId,
      isActive,
      hasBalance,
      includeExpired,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.CreditWhereInput = {
      tenantId,
    };

    if (customerId) where.customerId = customerId;
    if (reason) where.reason = reason;
    if (sourceBookingId) where.sourceBookingId = sourceBookingId;
    if (isActive !== undefined) where.isActive = isActive;

    if (hasBalance) {
      where.remainingAmount = { gt: 0 };
    }

    if (!includeExpired) {
      where.OR = [
        { isExpired: false },
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    const skip = (page - 1) * limit;

    // Build order by
    const orderBy: Prisma.CreditOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Execute queries
    const [credits, total] = await Promise.all([
      this.prisma.credit.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.credit.count({ where }),
    ]);

    return {
      items: credits.map((c) => this.toResponseDto(c)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get customer's credit balance
   */
  async getCustomerBalance(customerId: string): Promise<CustomerCreditBalanceDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot access customer from another tenant');
    }

    // Get all active, non-expired credits with balance
    const credits = await this.prisma.credit.findMany({
      where: {
        customerId,
        tenantId,
        isActive: true,
        remainingAmount: { gt: 0 },
        OR: [
          { isExpired: false },
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    // Calculate total balance
    const totalBalance = credits.reduce(
      (sum, credit) => sum + Number(credit.remainingAmount),
      0,
    );

    // Get primary currency from first credit or default
    const currency = credits.length > 0 ? credits[0].currency : 'ARS';

    return {
      customerId,
      totalBalance,
      currency,
      activeCreditsCount: credits.length,
      credits: credits.map((c) => this.toResponseDto(c)),
    };
  }

  /**
   * Use credits for a booking payment
   * Applies credits in FIFO order (oldest first) unless specific credit IDs provided
   */
  async useCredits(dto: UseCreditDto): Promise<ApplyCreditResultDto> {
    const tenantId = this.tenantContext.getTenantId();
    const userId = this.tenantContext.getUserId();

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Verify customer
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer || customer.tenantId !== tenantId) {
      throw new BadRequestException('Invalid customer');
    }

    // Verify booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });

    if (!booking || booking.tenantId !== tenantId) {
      throw new BadRequestException('Invalid booking');
    }

    // Get available credits
    let credits: Credit[];
    if (dto.creditIds && dto.creditIds.length > 0) {
      // Use specific credits
      credits = await this.prisma.credit.findMany({
        where: {
          id: { in: dto.creditIds },
          customerId: dto.customerId,
          tenantId,
          isActive: true,
          remainingAmount: { gt: 0 },
          OR: [
            { isExpired: false },
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
    } else {
      // Get all available credits (FIFO)
      credits = await this.prisma.credit.findMany({
        where: {
          customerId: dto.customerId,
          tenantId,
          isActive: true,
          remainingAmount: { gt: 0 },
          OR: [
            { isExpired: false },
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (credits.length === 0) {
      return {
        success: false,
        amountApplied: 0,
        remainingToPay: dto.amount,
        creditsUsed: [],
        message: 'No available credits found',
      };
    }

    // Apply credits
    let remainingToApply = dto.amount;
    let totalApplied = 0;
    const creditsUsed: string[] = [];

    for (const credit of credits) {
      if (remainingToApply <= 0) break;

      const availableAmount = Number(credit.remainingAmount);
      const amountToUse = Math.min(availableAmount, remainingToApply);

      // Update credit
      await this.prisma.credit.update({
        where: { id: credit.id },
        data: {
          remainingAmount: { decrement: amountToUse },
          usedAmount: { increment: amountToUse },
          usedInBookingIds: { push: dto.bookingId },
        },
      });

      creditsUsed.push(credit.id);
      totalApplied += amountToUse;
      remainingToApply -= amountToUse;
    }

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_CREDIT_USED,
      tenantId,
      actor: { type: 'USER', id: userId },
      action: `Credits used for booking ${dto.bookingId}`,
      entity: { type: 'BOOKING', id: dto.bookingId },
      metadata: {
        customerId: dto.customerId,
        amountApplied: totalApplied,
        creditsUsed,
      },
    });

    // Emit WebSocket event
    this.wsGateway.emitToTenant(tenantId, 'credit:used', {
      customerId: dto.customerId,
      bookingId: dto.bookingId,
      amountApplied: totalApplied,
    });

    this.logger.log(
      `Credits applied: ${totalApplied} to booking ${dto.bookingId} for customer ${dto.customerId}`,
    );

    return {
      success: true,
      amountApplied: totalApplied,
      remainingToPay: remainingToApply,
      creditsUsed,
      message: `Applied ${totalApplied} from ${creditsUsed.length} credit(s)`,
    };
  }

  /**
   * Create credit from early cancellation
   * Called when a customer cancels a booking more than 24 hours in advance
   */
  async createFromCancellation(
    bookingId: string,
    amount: number,
    paymentId?: string,
  ): Promise<CreditResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // Find customer by phone number
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId: booking.tenantId,
        phone: booking.customerPhone,
      },
    });

    if (!customer) {
      throw new BadRequestException('No customer found matching booking phone number');
    }

    // Create credit
    const credit = await this.prisma.credit.create({
      data: {
        tenantId: booking.tenantId,
        customerId: customer.id,
        originalAmount: new Decimal(amount),
        remainingAmount: new Decimal(amount),
        currency: 'ARS',
        reason: CreditReason.EARLY_CANCELLATION,
        sourceBookingId: bookingId,
        sourcePaymentId: paymentId,
        description: `Credit from cancelled booking ${bookingId}`,
        usedInBookingIds: [],
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_CREDIT_ADDED,
      tenantId: booking.tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Automatic credit from cancellation: ${bookingId}`,
      entity: { type: 'CREDIT', id: credit.id },
      metadata: {
        bookingId,
        customerId: customer.id,
        amount,
        reason: CreditReason.EARLY_CANCELLATION,
      },
    });

    // Emit WebSocket event
    this.wsGateway.emitToTenant(booking.tenantId, 'credit:created', {
      id: credit.id,
      customerId: customer.id,
      amount,
      reason: CreditReason.EARLY_CANCELLATION,
    });

    this.logger.log(
      `Credit created from cancellation: ${credit.id} for booking ${bookingId}, amount: ${amount}`,
    );

    return this.toResponseDto(credit);
  }

  /**
   * Deactivate a credit
   */
  async deactivate(id: string, reason?: string): Promise<CreditResponseDto> {
    const tenantId = this.tenantContext.getTenantId();
    const userId = this.tenantContext.getUserId();

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const credit = await this.prisma.credit.findUnique({
      where: { id },
    });

    if (!credit) {
      throw new NotFoundException(`Credit with ID ${id} not found`);
    }

    if (credit.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot deactivate credit from another tenant');
    }

    const updated = await this.prisma.credit.update({
      where: { id },
      data: {
        isActive: false,
        description: reason
          ? `${credit.description || ''} | Deactivated: ${reason}`.trim()
          : credit.description,
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_CREDIT_USED,
      tenantId,
      actor: { type: 'USER', id: userId },
      action: `Credit deactivated: ${id}`,
      entity: { type: 'CREDIT', id },
      metadata: {
        reason,
        remainingAmount: Number(credit.remainingAmount),
        action: 'deactivated',
      },
    });

    this.logger.log(`Credit deactivated: ${id}`);

    return this.toResponseDto(updated);
  }

  /**
   * Mark expired credits
   * Called periodically to update credit expiration status
   */
  async markExpiredCredits(): Promise<number> {
    const result = await this.prisma.credit.updateMany({
      where: {
        isExpired: false,
        expiresAt: { lte: new Date() },
        remainingAmount: { gt: 0 },
      },
      data: {
        isExpired: true,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} credits as expired`);
    }

    return result.count;
  }

  /**
   * Get credits for a specific booking
   */
  async getCreditsForBooking(bookingId: string): Promise<CreditResponseDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const credits = await this.prisma.credit.findMany({
      where: {
        tenantId,
        sourceBookingId: bookingId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return credits.map((c) => this.toResponseDto(c));
  }

  /**
   * Convert Credit to response DTO
   */
  private toResponseDto(credit: Credit): CreditResponseDto {
    return {
      id: credit.id,
      tenantId: credit.tenantId,
      customerId: credit.customerId,
      originalAmount: Number(credit.originalAmount),
      remainingAmount: Number(credit.remainingAmount),
      usedAmount: Number(credit.usedAmount),
      currency: credit.currency,
      reason: credit.reason,
      sourceBookingId: credit.sourceBookingId,
      sourcePaymentId: credit.sourcePaymentId,
      description: credit.description,
      usedInBookingIds: credit.usedInBookingIds,
      expiresAt: credit.expiresAt,
      isExpired: credit.isExpired,
      isActive: credit.isActive,
      createdById: credit.createdById,
      createdAt: credit.createdAt,
      updatedAt: credit.updatedAt,
    };
  }
}
