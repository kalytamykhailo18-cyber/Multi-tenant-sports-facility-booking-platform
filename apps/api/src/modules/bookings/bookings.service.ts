// Bookings Service
// Full booking management operations with slot locking and payment tracking

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
import { TimeSlotsService } from './time-slots.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto, CancelBookingDto, ChangeBookingStatusDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BookingResponseDto, BookingListResponseDto, CancellationResultDto } from './dto/booking-response.dto';
import { Booking, BookingStatus, CourtStatus, Prisma } from '@prisma/client';
import { CreditsService } from '../credits/credits.service';
import { Decimal } from '@prisma/client/runtime/library';

// Spanish month names for date formatting
const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Spanish status labels
const STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.AVAILABLE]: 'Disponible',
  [BookingStatus.RESERVED]: 'Reservado',
  [BookingStatus.PAID]: 'Pagado (seña)',
  [BookingStatus.CONFIRMED]: 'Confirmado',
  [BookingStatus.COMPLETED]: 'Completado',
  [BookingStatus.CANCELLED]: 'Cancelado',
  [BookingStatus.NO_SHOW]: 'No se presentó',
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
    private readonly wsGateway: WsGateway,
    private readonly timeSlotsService: TimeSlotsService,
    private readonly creditsService: CreditsService,
  ) {}

  /**
   * Create a new booking
   * Uses two-tier locking for race condition prevention:
   * Tier 1: Redis lock (fast, prevents duplicate payment initiation)
   * Tier 2: Database transaction with row-level checking (ensures data integrity)
   */
  async create(dto: CreateBookingDto): Promise<BookingResponseDto> {
    const {
      courtId,
      date,
      startTime,
      durationMinutes,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      depositPaid = false,
      fullyPaid = false,
      totalPriceOverride,
      lockToken,
    } = dto;

    // Get court and verify it exists
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: {
        facility: true,
      },
    });

    if (!court) {
      throw new NotFoundException(`Court with ID ${courtId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();
    const userId = this.tenantContext.getUserId();

    if (!isSuperAdmin && contextTenantId !== court.tenantId) {
      throw new ForbiddenException('Cannot create booking for this court');
    }

    // Check if court is active
    if (court.status !== CourtStatus.ACTIVE) {
      throw new BadRequestException('Court is not available for booking');
    }

    // Parse date
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    // Calculate end time
    const endTime = this.addMinutesToTime(startTime, durationMinutes);

    // Validate lock token if provided (for online bookings)
    if (lockToken) {
      const lockValidation = await this.timeSlotsService.validateLockToken(lockToken);
      if (!lockValidation.valid) {
        throw new ConflictException('Lock token is invalid or expired. Please try booking again.');
      }
      // Verify lock data matches the booking request
      if (
        lockValidation.lockData?.courtId !== courtId ||
        lockValidation.lockData?.date !== date ||
        lockValidation.lockData?.startTime !== startTime
      ) {
        throw new BadRequestException('Lock token does not match the booking details');
      }
    } else {
      // For manual bookings (staff/owner), check availability directly
      const availability = await this.timeSlotsService.checkSlotAvailable(
        courtId,
        date,
        startTime,
        durationMinutes,
      );

      if (!availability.available) {
        throw new ConflictException(availability.reason || 'Slot is not available');
      }
    }

    // Calculate price
    const pricePerHour = Number(court.basePricePerHour);
    const totalPrice = totalPriceOverride ?? (pricePerHour / 60) * durationMinutes;

    // Calculate deposit amount (based on facility's deposit percentage)
    const depositPercentage = court.facility.depositPercentage;
    const depositAmount = (totalPrice * depositPercentage) / 100;
    const balanceAmount = totalPrice - depositAmount;

    // Use database transaction to ensure atomicity and prevent race conditions
    // This is the second tier of protection (after Redis locks)
    const booking = await this.prisma.$transaction(async (tx) => {
      // Double-check for existing bookings within the transaction (race condition protection)
      const existingBooking = await tx.booking.findFirst({
        where: {
          courtId,
          date: bookingDate,
          status: {
            notIn: [BookingStatus.CANCELLED],
          },
          // Check for overlapping time slots
          OR: [
            // New booking starts during existing booking
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            // New booking ends during existing booking
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            // New booking completely contains existing booking
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      });

      if (existingBooking) {
        throw new ConflictException(
          'Slot was just booked by another user. Please select a different time.',
        );
      }

      // Create the booking within the transaction
      return tx.booking.create({
        data: {
          tenantId: court.tenantId,
          facilityId: court.facilityId,
          courtId,
          date: bookingDate,
          startTime,
          endTime,
          durationMinutes,
          status: fullyPaid ? BookingStatus.PAID : depositPaid ? BookingStatus.PAID : BookingStatus.RESERVED,
          customerName,
          customerPhone,
          customerEmail,
          totalPrice: new Decimal(totalPrice),
          depositAmount: new Decimal(depositAmount),
          depositPaid: depositPaid || fullyPaid,
          depositPaidAt: (depositPaid || fullyPaid) ? new Date() : null,
          balanceAmount: new Decimal(balanceAmount),
          balancePaid: fullyPaid,
          balancePaidAt: fullyPaid ? new Date() : null,
          notes,
          lockToken, // Store lock token for audit/debugging
          createdById: userId,
        },
        include: {
          court: {
            select: { name: true },
          },
          facility: {
            select: { name: true },
          },
          createdBy: {
            select: { fullName: true },
          },
        },
      });
    });

    // Release the Redis lock after successful booking (if lock token was provided)
    if (lockToken) {
      try {
        await this.timeSlotsService.unlockSlot(lockToken);
      } catch (error) {
        // Log but don't fail - the lock will expire anyway
        this.logger.warn(`Failed to release lock after booking: ${error}`);
      }
    }

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.BOOKING,
      eventType: AuditEventType.BOOKING_CREATED,
      tenantId: booking.tenantId,
      actor: { type: 'USER', id: userId || null },
      action: `Booking created: ${customerName} for ${court.name} on ${date} at ${startTime}`,
      entity: { type: 'BOOKING', id: booking.id },
      metadata: { customerPhone, courtId, date, startTime, durationMinutes },
    });

    this.logger.log(`Booking created: ${booking.id} for ${customerName}`);

    // Emit socket event
    this.wsGateway.emitToTenant(booking.tenantId, 'booking:created', {
      id: booking.id,
      courtId: booking.courtId,
      date: booking.date,
      startTime: booking.startTime,
      status: booking.status,
    });

    return this.toResponseDto(booking, booking.court, booking.facility, booking.createdBy);
  }

  /**
   * Find bookings with filters and pagination
   */
  async findAll(query: QueryBookingDto): Promise<BookingListResponseDto> {
    const {
      facilityId,
      courtId,
      startDate,
      endDate,
      status,
      statuses,
      customerPhone,
      search,
      depositPaid,
      fullyPaid,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'asc',
    } = query;

    // Build where clause
    const where: Prisma.BookingWhereInput = {};

    // Filter by tenant
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId) {
      where.tenantId = contextTenantId;
    }

    if (facilityId) {
      where.facilityId = facilityId;
    }

    if (courtId) {
      where.courtId = courtId;
    }

    if (startDate) {
      where.date = { ...((where.date as Prisma.DateTimeFilter) || {}), gte: new Date(startDate) };
    }

    if (endDate) {
      where.date = { ...((where.date as Prisma.DateTimeFilter) || {}), lte: new Date(endDate) };
    }

    if (status) {
      where.status = status;
    }

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (customerPhone) {
      where.customerPhone = { contains: customerPhone };
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (depositPaid !== undefined) {
      where.depositPaid = depositPaid;
    }

    if (fullyPaid !== undefined) {
      where.balancePaid = fullyPaid;
    }

    const skip = (page - 1) * limit;

    // Build order by
    const orderBy: Prisma.BookingOrderByWithRelationInput = {};
    if (sortBy === 'date') {
      orderBy.date = sortOrder;
    } else if (sortBy === 'startTime') {
      orderBy.startTime = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'customerName') {
      orderBy.customerName = sortOrder;
    }

    // Execute queries in parallel
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [orderBy, { startTime: 'asc' }],
        include: {
          court: {
            select: { name: true },
          },
          facility: {
            select: { name: true },
          },
          createdBy: {
            select: { fullName: true },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      items: bookings.map((b) => this.toResponseDto(b, b.court, b.facility, b.createdBy)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find booking by ID
   */
  async findById(id: string): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        court: {
          select: { name: true },
        },
        facility: {
          select: { name: true },
        },
        createdBy: {
          select: { fullName: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== booking.tenantId) {
      throw new ForbiddenException('Cannot access this booking');
    }

    return this.toResponseDto(booking, booking.court, booking.facility, booking.createdBy);
  }

  /**
   * Find bookings by date range (commonly used for calendar)
   */
  async findByDateRange(
    facilityId: string,
    startDate: string,
    endDate: string,
  ): Promise<BookingResponseDto[]> {
    // Verify facility exists and check access
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== facility.tenantId) {
      throw new ForbiddenException('Cannot access bookings for this facility');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        facilityId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        court: {
          select: { name: true },
        },
        facility: {
          select: { name: true },
        },
        createdBy: {
          select: { fullName: true },
        },
      },
    });

    return bookings.map((b) => this.toResponseDto(b, b.court, b.facility, b.createdBy));
  }

  /**
   * Update a booking
   */
  async update(id: string, dto: UpdateBookingDto): Promise<BookingResponseDto> {
    // Get existing booking
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        court: true,
        facility: true,
      },
    });

    if (!existingBooking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();
    const userId = this.tenantContext.getUserId();

    if (!isSuperAdmin && contextTenantId !== existingBooking.tenantId) {
      throw new ForbiddenException('Cannot update this booking');
    }

    // Cannot update cancelled or completed bookings
    if (
      existingBooking.status === BookingStatus.CANCELLED ||
      existingBooking.status === BookingStatus.COMPLETED ||
      existingBooking.status === BookingStatus.NO_SHOW
    ) {
      throw new BadRequestException(`Cannot update a ${existingBooking.status.toLowerCase()} booking`);
    }

    // Build update data
    const updateData: Prisma.BookingUpdateInput = {};

    // Handle reschedule (date, time, or court change)
    if (dto.courtId || dto.date || dto.startTime || dto.durationMinutes) {
      const newCourtId = dto.courtId || existingBooking.courtId;
      const newDate = dto.date || existingBooking.date.toISOString().split('T')[0];
      const newStartTime = dto.startTime || existingBooking.startTime;
      const newDuration = dto.durationMinutes || existingBooking.durationMinutes;

      // Check if new slot is available
      const availability = await this.timeSlotsService.checkSlotAvailable(
        newCourtId,
        newDate,
        newStartTime,
        newDuration,
      );

      // If slot is not available, check if it's because of THIS booking
      if (!availability.available) {
        // Check if it's the same slot (no actual change)
        const isSameSlot =
          newCourtId === existingBooking.courtId &&
          newDate === existingBooking.date.toISOString().split('T')[0] &&
          newStartTime === existingBooking.startTime;

        if (!isSameSlot) {
          throw new ConflictException(availability.reason || 'New slot is not available');
        }
      }

      if (dto.courtId) {
        // Verify new court exists and is in same facility
        const newCourt = await this.prisma.court.findUnique({
          where: { id: dto.courtId },
        });

        if (!newCourt) {
          throw new NotFoundException(`Court with ID ${dto.courtId} not found`);
        }

        if (newCourt.facilityId !== existingBooking.facilityId) {
          throw new BadRequestException('Cannot move booking to a court in a different facility');
        }

        updateData.court = { connect: { id: dto.courtId } };
      }

      if (dto.date) {
        const newBookingDate = new Date(dto.date);
        newBookingDate.setHours(0, 0, 0, 0);
        updateData.date = newBookingDate;
      }

      if (dto.startTime) {
        updateData.startTime = dto.startTime;
        const duration = dto.durationMinutes || existingBooking.durationMinutes;
        updateData.endTime = this.addMinutesToTime(dto.startTime, duration);
      }

      if (dto.durationMinutes) {
        updateData.durationMinutes = dto.durationMinutes;
        const start = dto.startTime || existingBooking.startTime;
        updateData.endTime = this.addMinutesToTime(start, dto.durationMinutes);

        // Recalculate price if duration changes
        const court = await this.prisma.court.findUnique({
          where: { id: dto.courtId || existingBooking.courtId },
        });
        if (court) {
          const pricePerHour = Number(court.basePricePerHour);
          const totalPrice = (pricePerHour / 60) * dto.durationMinutes;
          const depositAmount = (totalPrice * existingBooking.facility.depositPercentage) / 100;
          updateData.totalPrice = new Decimal(totalPrice);
          updateData.depositAmount = new Decimal(depositAmount);
          updateData.balanceAmount = new Decimal(totalPrice - depositAmount);
        }
      }
    }

    // Update customer info
    if (dto.customerName !== undefined) updateData.customerName = dto.customerName;
    if (dto.customerPhone !== undefined) updateData.customerPhone = dto.customerPhone;
    if (dto.customerEmail !== undefined) updateData.customerEmail = dto.customerEmail;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Update payment status
    if (dto.depositPaid !== undefined) {
      updateData.depositPaid = dto.depositPaid;
      if (dto.depositPaid && !existingBooking.depositPaid) {
        updateData.depositPaidAt = new Date();
        // Update status to PAID if not already
        if (existingBooking.status === BookingStatus.RESERVED) {
          updateData.status = BookingStatus.PAID;
        }
      } else if (!dto.depositPaid) {
        updateData.depositPaidAt = null;
        // Revert status if deposit unpaid
        if (existingBooking.status === BookingStatus.PAID && !existingBooking.balancePaid) {
          updateData.status = BookingStatus.RESERVED;
        }
      }
    }

    if (dto.balancePaid !== undefined) {
      updateData.balancePaid = dto.balancePaid;
      if (dto.balancePaid && !existingBooking.balancePaid) {
        updateData.balancePaidAt = new Date();
      } else if (!dto.balancePaid) {
        updateData.balancePaidAt = null;
      }
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        court: {
          select: { name: true },
        },
        facility: {
          select: { name: true },
        },
        createdBy: {
          select: { fullName: true },
        },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.BOOKING,
      eventType: AuditEventType.BOOKING_UPDATED,
      tenantId: updatedBooking.tenantId,
      actor: { type: 'USER', id: userId || null },
      action: `Booking updated: ${updatedBooking.customerName}`,
      entity: { type: 'BOOKING', id: updatedBooking.id },
      metadata: { changes: dto },
      changes: {
        before: existingBooking as unknown as Record<string, unknown>,
        after: updatedBooking as unknown as Record<string, unknown>,
      },
    });

    this.logger.log(`Booking updated: ${updatedBooking.id}`);

    // Emit socket event
    this.wsGateway.emitToTenant(updatedBooking.tenantId, 'booking:updated', {
      id: updatedBooking.id,
      courtId: updatedBooking.courtId,
      date: updatedBooking.date,
      startTime: updatedBooking.startTime,
      status: updatedBooking.status,
    });

    return this.toResponseDto(updatedBooking, updatedBooking.court, updatedBooking.facility, updatedBooking.createdBy);
  }

  /**
   * Cancel a booking
   * Implements the 24-hour rule:
   * - If cancelled more than 24 hours before: deposit becomes credit
   * - If cancelled less than 24 hours before: deposit is forfeited
   */
  async cancel(id: string, dto?: CancelBookingDto): Promise<CancellationResultDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        court: { select: { name: true } },
        facility: true,
        createdBy: { select: { fullName: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();
    const userId = this.tenantContext.getUserId();

    if (!isSuperAdmin && contextTenantId !== booking.tenantId) {
      throw new ForbiddenException('Cannot cancel this booking');
    }

    // Cannot cancel already cancelled or completed bookings
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.NO_SHOW) {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    // Calculate hours until booking
    const now = new Date();
    const bookingDateTime = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Determine if deposit should become credit (>24 hours rule)
    const isEarlyCancellation = hoursUntilBooking > 24;
    const depositPaid = booking.depositPaid;
    const depositAmount = Number(booking.depositAmount);

    let depositConvertedToCredit = false;
    let depositForfeited = false;
    let creditId: string | undefined;
    let creditAmount: number | undefined;
    let message: string;

    // Update booking status
    const cancelledBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto?.reason,
      },
      include: {
        court: { select: { name: true } },
        facility: { select: { name: true } },
        createdBy: { select: { fullName: true } },
      },
    });

    // Handle deposit based on 24-hour rule
    if (depositPaid && depositAmount > 0) {
      if (isEarlyCancellation) {
        // Early cancellation (>24 hours): Convert deposit to credit
        try {
          const credit = await this.creditsService.createFromCancellation(
            booking.id,
            depositAmount,
            booking.paymentId || undefined,
          );
          depositConvertedToCredit = true;
          creditId = credit.id;
          creditAmount = depositAmount;
          message = `Cancellation accepted. Deposit of $${depositAmount} converted to credit for future bookings.`;

          this.logger.log(
            `Booking ${id} cancelled early. Deposit $${depositAmount} converted to credit ${credit.id}`,
          );
        } catch (error) {
          // Log error but don't fail the cancellation
          this.logger.warn(
            `Failed to create credit for booking ${id}: ${error}. Customer may not have a registered account.`,
          );
          message = `Cancellation accepted. Deposit credit could not be created automatically - please process manually.`;
        }
      } else {
        // Late cancellation (<24 hours): Deposit is forfeited
        depositForfeited = true;
        message = `Cancellation accepted. Deposit of $${depositAmount} is forfeited as the booking is within 24 hours.`;

        this.logger.log(`Booking ${id} cancelled late. Deposit $${depositAmount} forfeited.`);
      }
    } else {
      message = 'Booking cancelled successfully.';
    }

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.BOOKING,
      eventType: AuditEventType.BOOKING_CANCELLED,
      tenantId: cancelledBooking.tenantId,
      actor: { type: 'USER', id: userId || null },
      action: `Booking cancelled: ${cancelledBooking.customerName}`,
      entity: { type: 'BOOKING', id: cancelledBooking.id },
      metadata: {
        reason: dto?.reason,
        hoursUntilBooking: Math.round(hoursUntilBooking),
        depositPaid,
        depositAmount,
        depositConvertedToCredit,
        depositForfeited,
        creditId,
      },
    });

    this.logger.log(`Booking cancelled: ${cancelledBooking.id}`);

    // Emit socket event
    this.wsGateway.emitToTenant(cancelledBooking.tenantId, 'booking:cancelled', {
      id: cancelledBooking.id,
      courtId: cancelledBooking.courtId,
      date: cancelledBooking.date,
      startTime: cancelledBooking.startTime,
      depositConvertedToCredit,
      depositForfeited,
    });

    return {
      booking: this.toResponseDto(
        cancelledBooking,
        cancelledBooking.court,
        cancelledBooking.facility,
        cancelledBooking.createdBy,
      ),
      depositConvertedToCredit,
      creditId,
      creditAmount,
      depositForfeited,
      message,
    };
  }

  /**
   * Change booking status
   */
  async changeStatus(id: string, dto: ChangeBookingStatusDto): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();
    const userId = this.tenantContext.getUserId();

    if (!isSuperAdmin && contextTenantId !== booking.tenantId) {
      throw new ForbiddenException('Cannot update this booking');
    }

    // Validate status transition
    this.validateStatusTransition(booking.status, dto.status);

    // Build update data based on new status
    const updateData: Prisma.BookingUpdateInput = {
      status: dto.status,
    };

    // Handle status-specific updates
    if (dto.status === BookingStatus.CONFIRMED && !booking.confirmedAt) {
      updateData.confirmedAt = new Date();
    } else if (dto.status === BookingStatus.NO_SHOW && !booking.noShowMarkedAt) {
      updateData.noShowMarkedAt = new Date();
    } else if (dto.status === BookingStatus.CANCELLED && !booking.cancelledAt) {
      updateData.cancelledAt = new Date();
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        court: { select: { name: true } },
        facility: { select: { name: true } },
        createdBy: { select: { fullName: true } },
      },
    });

    // Log audit event
    this.auditService.log({
      category: AuditEventCategory.BOOKING,
      eventType: AuditEventType.BOOKING_STATUS_CHANGED,
      tenantId: updatedBooking.tenantId,
      actor: { type: 'USER', id: userId || null },
      action: `Booking status changed: ${booking.status} → ${dto.status}`,
      entity: { type: 'BOOKING', id: updatedBooking.id },
      metadata: { oldStatus: booking.status, newStatus: dto.status },
    });

    this.logger.log(`Booking status changed: ${updatedBooking.id} → ${dto.status}`);

    // Emit socket event
    this.wsGateway.emitToTenant(updatedBooking.tenantId, 'booking:status_changed', {
      id: updatedBooking.id,
      courtId: updatedBooking.courtId,
      date: updatedBooking.date,
      startTime: updatedBooking.startTime,
      oldStatus: booking.status,
      newStatus: dto.status,
    });

    return this.toResponseDto(updatedBooking, updatedBooking.court, updatedBooking.facility, updatedBooking.createdBy);
  }

  /**
   * Mark booking as completed
   */
  async markCompleted(id: string): Promise<BookingResponseDto> {
    return this.changeStatus(id, { status: BookingStatus.COMPLETED });
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(id: string): Promise<BookingResponseDto> {
    return this.changeStatus(id, { status: BookingStatus.NO_SHOW });
  }

  /**
   * Mark customer as confirmed (from morning message)
   */
  async markConfirmed(id: string): Promise<BookingResponseDto> {
    return this.changeStatus(id, { status: BookingStatus.CONFIRMED });
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Validate status transition
   */
  private validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    // Define valid transitions
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.AVAILABLE]: [], // Not a real booking status
      [BookingStatus.RESERVED]: [BookingStatus.PAID, BookingStatus.CANCELLED],
      [BookingStatus.PAID]: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
      [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
      [BookingStatus.COMPLETED]: [], // Terminal state
      [BookingStatus.CANCELLED]: [], // Terminal state
      [BookingStatus.NO_SHOW]: [], // Terminal state
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Add minutes to a time string (HH:mm)
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  /**
   * Format date for display in Spanish
   */
  private formatDateSpanish(date: Date): string {
    const day = date.getDate();
    const month = MONTH_NAMES_ES[date.getMonth()];
    return `${day} de ${month}`;
  }

  /**
   * Convert booking to response DTO
   */
  private toResponseDto(
    booking: Booking,
    court?: { name: string } | null,
    facility?: { name: string } | null,
    createdBy?: { fullName: string } | null,
  ): BookingResponseDto {
    return {
      id: booking.id,
      tenantId: booking.tenantId,
      facilityId: booking.facilityId,
      courtId: booking.courtId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      durationMinutes: booking.durationMinutes,
      status: booking.status,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      totalPrice: Number(booking.totalPrice),
      depositAmount: Number(booking.depositAmount),
      depositPaid: booking.depositPaid,
      depositPaidAt: booking.depositPaidAt,
      balanceAmount: Number(booking.balanceAmount),
      balancePaid: booking.balancePaid,
      balancePaidAt: booking.balancePaidAt,
      notes: booking.notes,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      noShowMarkedAt: booking.noShowMarkedAt,
      confirmedAt: booking.confirmedAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      // Computed/joined fields
      courtName: court?.name,
      facilityName: facility?.name,
      createdByName: createdBy?.fullName,
      formattedDate: this.formatDateSpanish(booking.date),
      statusLabel: STATUS_LABELS[booking.status],
    };
  }
}
