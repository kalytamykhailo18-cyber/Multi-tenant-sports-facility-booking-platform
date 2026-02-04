// Customers Service
// Full customer management operations with reputation tracking

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEventType, AuditEventCategory } from '../../common/audit/audit.types';
import { WsGateway } from '../../common/gateway/ws.gateway';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CustomerSummaryDto, CustomerDetailsDto, CustomerNoteDto, ReputationHistoryDto, PaginatedCustomersDto, CustomerWithRelationsDto } from './dto/customer-response.dto';
import { AddCustomerNoteDto } from './dto/customer-note.dto';
import { UpdateReputationDto } from './dto/update-reputation.dto';
import { AddCreditDto } from './dto/add-credit.dto';
import { BlockCustomerDto } from './dto/block-customer.dto';
import { Customer, Prisma, ReputationLevel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Reputation constants
const REPUTATION_THRESHOLDS = {
  GOOD_MIN: 80,
  CAUTION_MIN: 50,
};

const REPUTATION_CHANGES = {
  COMPLETED: 5,
  NO_SHOW: -20,
  LATE_CANCELLATION: -10,
  EARLY_CANCELLATION: -5,
};

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
  ) {}

  /**
   * Create a new customer
   */
  async create(dto: CreateCustomerDto): Promise<CustomerDetailsDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Check if phone already exists for this tenant
    const existingCustomer = await this.prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone: dto.phone,
        },
      },
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this phone number already exists');
    }

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
        reputationScore: 100,
        reputationLevel: ReputationLevel.GOOD,
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_CREATED,
      tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Customer created: ${customer.name}`,
      entity: { type: 'CUSTOMER', id: customer.id },
      metadata: { name: customer.name, phone: customer.phone },
    });

    this.logger.log(`Customer created: ${customer.name} (${customer.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, 'customer:created', {
      id: customer.id,
      name: customer.name,
    });

    return this.toDetailsDto(customer);
  }

  /**
   * Find all customers with pagination and filtering
   */
  async findAll(query: QueryCustomerDto): Promise<PaginatedCustomersDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const {
      page = 1,
      limit = 20,
      search,
      reputationLevel,
      isBlocked,
      hasCredit,
      hasBookingAfter,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CustomerWhereInput = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (reputationLevel) {
      where.reputationLevel = reputationLevel;
    }

    if (isBlocked !== undefined) {
      where.isBlocked = isBlocked;
    }

    if (hasCredit) {
      where.creditBalance = { gt: 0 };
    }

    if (hasBookingAfter) {
      where.lastBookingDate = { gte: new Date(hasBookingAfter) };
    }

    // Build orderBy
    const validSortFields = ['name', 'phone', 'reputationScore', 'totalBookings', 'lastBookingDate', 'createdAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [orderField]: sortOrder || 'asc',
    };

    // Execute queries in parallel
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.customer.count({ where }),
    ]);

    // Map to response DTOs
    const data: CustomerSummaryDto[] = customers.map((customer) => this.toSummaryDto(customer));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<CustomerWithRelationsDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        preferredCourt: true,
        customerNotes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { fullName: true },
            },
          },
        },
        reputationHistory: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot access customer from another tenant');
    }

    return this.toWithRelationsDto(customer);
  }

  /**
   * Find customer by phone number
   */
  async findByPhone(phone: string): Promise<CustomerDetailsDto | null> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone,
        },
      },
    });

    if (!customer) {
      return null;
    }

    return this.toDetailsDto(customer);
  }

  /**
   * Update customer
   */
  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerDetailsDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (existingCustomer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot update customer from another tenant');
    }

    // Update customer
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.isBlocked !== undefined && { isBlocked: dto.isBlocked }),
        ...(dto.blockedReason !== undefined && { blockedReason: dto.blockedReason }),
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_UPDATED,
      tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Customer updated: ${customer.name}`,
      entity: { type: 'CUSTOMER', id: customer.id },
      metadata: { changes: dto },
      changes: {
        before: existingCustomer as unknown as Record<string, unknown>,
        after: customer as unknown as Record<string, unknown>,
      },
    });

    this.logger.log(`Customer updated: ${customer.name} (${customer.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, 'customer:updated', {
      id: customer.id,
      name: customer.name,
    });

    return this.toDetailsDto(customer);
  }

  /**
   * Block or unblock customer
   */
  async setBlocked(id: string, dto: BlockCustomerDto): Promise<CustomerDetailsDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (existingCustomer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot modify customer from another tenant');
    }

    // Blocking requires a reason
    if (dto.block && !dto.reason) {
      throw new BadRequestException('Reason is required when blocking a customer');
    }

    // Update customer
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        isBlocked: dto.block,
        blockedReason: dto.block ? dto.reason : null,
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: dto.block ? AuditEventType.CUSTOMER_BLOCKED : AuditEventType.CUSTOMER_UNBLOCKED,
      tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Customer ${dto.block ? 'blocked' : 'unblocked'}: ${customer.name}`,
      entity: { type: 'CUSTOMER', id: customer.id },
      metadata: { reason: dto.reason },
    });

    this.logger.log(`Customer ${dto.block ? 'blocked' : 'unblocked'}: ${customer.name} (${customer.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, dto.block ? 'customer:blocked' : 'customer:unblocked', {
      id: customer.id,
      name: customer.name,
    });

    return this.toDetailsDto(customer);
  }

  /**
   * Update customer reputation manually
   */
  async updateReputation(id: string, dto: UpdateReputationDto): Promise<CustomerDetailsDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (existingCustomer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot modify customer from another tenant');
    }

    const previousScore = existingCustomer.reputationScore;
    const newLevel = this.getReputationLevel(dto.score);

    // Update customer reputation
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        reputationScore: dto.score,
        reputationLevel: newLevel,
      },
    });

    // Record reputation history
    await this.prisma.reputationHistory.create({
      data: {
        tenantId,
        customerId: id,
        changeType: 'MANUAL',
        changeAmount: dto.score - previousScore,
        previousScore,
        newScore: dto.score,
        reason: dto.reason || 'Manual adjustment',
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_REPUTATION_CHANGED,
      tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Customer reputation updated: ${customer.name}`,
      entity: { type: 'CUSTOMER', id: customer.id },
      metadata: { previousScore, newScore: dto.score, reason: dto.reason },
    });

    this.logger.log(`Customer reputation updated: ${customer.name} (${customer.id}) - ${previousScore} -> ${dto.score}`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, 'customer:reputation_changed', {
      id: customer.id,
      name: customer.name,
      reputationScore: dto.score,
      reputationLevel: newLevel,
    });

    return this.toDetailsDto(customer);
  }

  /**
   * Add credit to customer account
   */
  async addCredit(id: string, dto: AddCreditDto): Promise<CustomerDetailsDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (existingCustomer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot modify customer from another tenant');
    }

    const previousBalance = Number(existingCustomer.creditBalance);
    const newBalance = previousBalance + dto.amount;

    // Update customer credit balance
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        creditBalance: new Decimal(newBalance),
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.CUSTOMER,
      eventType: AuditEventType.CUSTOMER_CREDIT_ADDED,
      tenantId,
      actor: { type: 'SYSTEM', id: null },
      action: `Credit added to customer: ${customer.name}`,
      entity: { type: 'CUSTOMER', id: customer.id },
      metadata: {
        amount: dto.amount,
        previousBalance,
        newBalance,
        reason: dto.reason,
      },
    });

    this.logger.log(`Credit added to customer: ${customer.name} (${customer.id}) - +${dto.amount}`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, 'customer:credit_added', {
      id: customer.id,
      name: customer.name,
      amount: dto.amount,
      newBalance,
    });

    return this.toDetailsDto(customer);
  }

  /**
   * Add note to customer
   */
  async addNote(id: string, dto: AddCustomerNoteDto, userId?: string): Promise<CustomerNoteDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot add note to customer from another tenant');
    }

    // Create note
    const note = await this.prisma.customerNote.create({
      data: {
        tenantId,
        customerId: id,
        content: dto.content,
        createdById: userId || null,
      },
      include: {
        createdBy: {
          select: { fullName: true },
        },
      },
    });

    this.logger.log(`Note added to customer: ${customer.name} (${customer.id})`);

    // Emit socket event
    this.wsGateway.emitToTenant(tenantId, 'customer:note_added', {
      customerId: customer.id,
      noteId: note.id,
    });

    return {
      id: note.id,
      content: note.content,
      createdByName: note.createdBy?.fullName,
      createdAt: note.createdAt.toISOString(),
    };
  }

  /**
   * Get customer notes
   */
  async getNotes(id: string, limit = 20): Promise<CustomerNoteDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot access customer from another tenant');
    }

    const notes = await this.prisma.customerNote.findMany({
      where: { customerId: id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { fullName: true },
        },
      },
    });

    return notes.map((note) => ({
      id: note.id,
      content: note.content,
      createdByName: note.createdBy?.fullName,
      createdAt: note.createdAt.toISOString(),
    }));
  }

  /**
   * Get customer reputation history
   */
  async getReputationHistory(id: string, limit = 20): Promise<ReputationHistoryDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (customer.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot access customer from another tenant');
    }

    const history = await this.prisma.reputationHistory.findMany({
      where: { customerId: id },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return history.map((entry) => ({
      id: entry.id,
      changeType: entry.changeType,
      changeAmount: entry.changeAmount,
      previousScore: entry.previousScore,
      newScore: entry.newScore,
      bookingId: entry.bookingId || undefined,
      reason: entry.reason || undefined,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  /**
   * Update reputation based on booking event (internal use)
   */
  async updateReputationFromBooking(
    customerId: string,
    eventType: 'COMPLETED' | 'NO_SHOW' | 'LATE_CANCELLATION' | 'EARLY_CANCELLATION',
    bookingId?: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      this.logger.warn(`Customer not found for reputation update: ${customerId}`);
      return;
    }

    const changeAmount = REPUTATION_CHANGES[eventType] || 0;
    const previousScore = customer.reputationScore;
    const newScore = Math.max(0, Math.min(200, previousScore + changeAmount));
    const newLevel = this.getReputationLevel(newScore);

    // Update stats based on event
    const statsUpdate: Prisma.CustomerUpdateInput = {
      reputationScore: newScore,
      reputationLevel: newLevel,
    };

    switch (eventType) {
      case 'COMPLETED':
        statsUpdate.totalBookings = { increment: 1 };
        statsUpdate.completedBookings = { increment: 1 };
        break;
      case 'NO_SHOW':
        statsUpdate.totalBookings = { increment: 1 };
        statsUpdate.noShowCount = { increment: 1 };
        break;
      case 'LATE_CANCELLATION':
        statsUpdate.cancellationCount = { increment: 1 };
        statsUpdate.lateCancellationCount = { increment: 1 };
        break;
      case 'EARLY_CANCELLATION':
        statsUpdate.cancellationCount = { increment: 1 };
        break;
    }

    // Update customer
    await this.prisma.customer.update({
      where: { id: customerId },
      data: statsUpdate,
    });

    // Record reputation history
    await this.prisma.reputationHistory.create({
      data: {
        tenantId: customer.tenantId,
        customerId,
        changeType: eventType,
        changeAmount,
        previousScore,
        newScore,
        bookingId,
        reason: this.getReputationChangeReason(eventType),
      },
    });

    this.logger.log(
      `Reputation updated for customer ${customerId}: ${eventType} (${previousScore} -> ${newScore})`,
    );
  }

  /**
   * Find or create customer by phone (for booking)
   */
  async findOrCreate(
    phone: string,
    name: string,
    email?: string,
  ): Promise<CustomerDetailsDto> {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Try to find existing customer
    let customer = await this.prisma.customer.findUnique({
      where: {
        tenantId_phone: {
          tenantId,
          phone,
        },
      },
    });

    // Create if not exists
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          tenantId,
          name,
          phone,
          email,
          reputationScore: 100,
          reputationLevel: ReputationLevel.GOOD,
        },
      });

      this.auditService.log({
        category: AuditEventCategory.CUSTOMER,
        eventType: AuditEventType.CUSTOMER_CREATED,
        tenantId,
        actor: { type: 'SYSTEM', id: null },
        action: `Customer auto-created from booking: ${customer.name}`,
        entity: { type: 'CUSTOMER', id: customer.id },
        metadata: { name: customer.name, phone: customer.phone },
      });

      this.logger.log(`Customer auto-created: ${customer.name} (${customer.id})`);
    }

    return this.toDetailsDto(customer);
  }

  /**
   * Update customer's last booking date
   */
  async updateLastBookingDate(customerId: string, date: Date): Promise<void> {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { lastBookingDate: date },
    });
  }

  // ==========================================
  // Helper Methods
  // ==========================================

  private getReputationLevel(score: number): ReputationLevel {
    if (score >= REPUTATION_THRESHOLDS.GOOD_MIN) return ReputationLevel.GOOD;
    if (score >= REPUTATION_THRESHOLDS.CAUTION_MIN) return ReputationLevel.CAUTION;
    return ReputationLevel.POOR;
  }

  private getReputationChangeReason(eventType: string): string {
    switch (eventType) {
      case 'COMPLETED':
        return 'Completed booking';
      case 'NO_SHOW':
        return 'No-show for booking';
      case 'LATE_CANCELLATION':
        return 'Late cancellation (< 24h)';
      case 'EARLY_CANCELLATION':
        return 'Early cancellation';
      default:
        return 'Unknown event';
    }
  }

  private toSummaryDto(customer: Customer): CustomerSummaryDto {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      reputationScore: customer.reputationScore,
      reputationLevel: customer.reputationLevel,
      totalBookings: customer.totalBookings,
      noShowCount: customer.noShowCount,
      isBlocked: customer.isBlocked,
      lastBookingDate: customer.lastBookingDate?.toISOString().split('T')[0],
    };
  }

  private toDetailsDto(customer: Customer): CustomerDetailsDto {
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email || undefined,
      reputationScore: customer.reputationScore,
      reputationLevel: customer.reputationLevel,
      totalBookings: customer.totalBookings,
      completedBookings: customer.completedBookings,
      noShowCount: customer.noShowCount,
      cancellationCount: customer.cancellationCount,
      lateCancellationCount: customer.lateCancellationCount,
      creditBalance: Number(customer.creditBalance),
      notes: customer.notes || undefined,
      isBlocked: customer.isBlocked,
      blockedReason: customer.blockedReason || undefined,
      preferredCourtId: customer.preferredCourtId || undefined,
      preferredTime: customer.preferredTime || undefined,
      lastBookingDate: customer.lastBookingDate?.toISOString().split('T')[0],
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  private toWithRelationsDto(
    customer: Customer & {
      preferredCourt?: { name: string } | null;
      customerNotes: Array<{
        id: string;
        content: string;
        createdAt: Date;
        createdBy?: { fullName: string } | null;
      }>;
      reputationHistory: Array<{
        id: string;
        changeType: string;
        changeAmount: number;
        previousScore: number;
        newScore: number;
        bookingId: string | null;
        reason: string | null;
        createdAt: Date;
      }>;
    },
  ): CustomerWithRelationsDto {
    return {
      ...this.toDetailsDto(customer),
      preferredCourtName: customer.preferredCourt?.name,
      recentNotes: customer.customerNotes.map((note) => ({
        id: note.id,
        content: note.content,
        createdByName: note.createdBy?.fullName,
        createdAt: note.createdAt.toISOString(),
      })),
      reputationHistory: customer.reputationHistory.map((entry) => ({
        id: entry.id,
        changeType: entry.changeType,
        changeAmount: entry.changeAmount,
        previousScore: entry.previousScore,
        newScore: entry.newScore,
        bookingId: entry.bookingId || undefined,
        reason: entry.reason || undefined,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }
}
