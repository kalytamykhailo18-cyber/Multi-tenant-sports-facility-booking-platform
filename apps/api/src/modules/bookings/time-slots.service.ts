// Time Slots Service
// Handles dynamic time slot generation and slot locking for race condition prevention

import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { TenantContextService } from '../../common/tenant';
import { RedisService } from '../../redis/redis.service';
import { WsGateway } from '../../common/gateway';
import { OperatingHoursService } from '../operating-hours/operating-hours.service';
import {
  QueryTimeSlotsDto,
  TimeSlotResponseDto,
  DaySlotsResponseDto,
  SlotLockResponseDto,
} from './dto';
import { BookingStatus, CourtStatus, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Constants
const SLOT_LOCK_TTL_SECONDS = 300; // 5 minutes
const SLOT_LOCK_PREFIX = 'lock:slot:';

@Injectable()
export class TimeSlotsService {
  private readonly logger = new Logger(TimeSlotsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly redisService: RedisService,
    private readonly wsGateway: WsGateway,
    private readonly operatingHoursService: OperatingHoursService,
  ) {}

  /**
   * Get all time slots for a facility on a specific date
   * Dynamically generates slots based on operating hours and existing bookings
   */
  async getDaySlots(query: QueryTimeSlotsDto): Promise<DaySlotsResponseDto> {
    const { facilityId, date, courtId } = query;

    // Parse the date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Verify facility exists and get tenant info
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
      throw new ForbiddenException('Cannot access slots for this facility');
    }

    // Get effective hours for the date (considers special hours)
    const effectiveHours = await this.operatingHoursService.getEffectiveHours(
      facilityId,
      targetDate,
    );

    // If facility is closed, return empty slots
    if (!effectiveHours.isOpen || !effectiveHours.openTime || !effectiveHours.closeTime) {
      return {
        facilityId,
        date,
        isOpen: false,
        openTime: null,
        closeTime: null,
        specialHoursReason: effectiveHours.reason,
        slots: [],
        courts: [],
      };
    }

    // Get active courts for the facility
    const courtWhere: Prisma.CourtWhereInput = {
      facilityId,
      status: CourtStatus.ACTIVE,
    };

    if (courtId) {
      courtWhere.id = courtId;
    }

    const courts = await this.prisma.court.findMany({
      where: courtWhere,
      orderBy: { displayOrder: 'asc' },
    });

    if (courts.length === 0) {
      return {
        facilityId,
        date,
        isOpen: effectiveHours.isOpen,
        openTime: effectiveHours.openTime,
        closeTime: effectiveHours.closeTime,
        specialHoursReason: effectiveHours.reason,
        slots: [],
        courts: [],
      };
    }

    // Get all bookings for the date
    const bookings = await this.prisma.booking.findMany({
      where: {
        facilityId,
        date: targetDate,
        status: {
          notIn: [BookingStatus.CANCELLED],
        },
        ...(courtId && { courtId }),
      },
    });

    // Get all locked slots from Redis
    const lockedSlots = await this.getLockedSlotsForDate(
      courts.map((c) => c.id),
      date,
    );

    // Generate slots for each court
    const allSlots: TimeSlotResponseDto[] = [];

    for (const court of courts) {
      const courtBookings = bookings.filter((b) => b.courtId === court.id);
      const courtLockedSlots = lockedSlots.filter((l) => l.courtId === court.id);

      const slots = this.generateSlotsForCourt(
        court,
        targetDate,
        date,
        effectiveHours.openTime!,
        effectiveHours.closeTime!,
        effectiveHours.sessionDurationMinutes,
        effectiveHours.bufferMinutes,
        courtBookings,
        courtLockedSlots,
      );

      allSlots.push(...slots);
    }

    return {
      facilityId,
      date,
      isOpen: true,
      openTime: effectiveHours.openTime,
      closeTime: effectiveHours.closeTime,
      specialHoursReason: effectiveHours.reason,
      slots: allSlots,
      courts: courts.map((court) => ({
        id: court.id,
        name: court.name,
        sportType: court.sportType,
        basePricePerHour: Number(court.basePricePerHour),
      })),
    };
  }

  /**
   * Check if a specific slot is available
   */
  async checkSlotAvailable(
    courtId: string,
    date: string,
    startTime: string,
    durationMinutes: number = 60,
  ): Promise<{ available: boolean; reason?: string }> {
    // Calculate end time
    const endTime = this.addMinutesToTime(startTime, durationMinutes);

    // Get court and verify access
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      include: { facility: true },
    });

    if (!court) {
      throw new NotFoundException(`Court with ID ${courtId} not found`);
    }

    // Check tenant access
    const contextTenantId = this.tenantContext.getTenantId();
    const isSuperAdmin = this.tenantContext.isSuperAdmin();

    if (!isSuperAdmin && contextTenantId !== court.tenantId) {
      throw new ForbiddenException('Cannot access this court');
    }

    // Check if court is active
    if (court.status !== CourtStatus.ACTIVE) {
      return { available: false, reason: 'Court is not available' };
    }

    // Parse date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get effective hours
    const effectiveHours = await this.operatingHoursService.getEffectiveHours(
      court.facilityId,
      targetDate,
    );

    if (!effectiveHours.isOpen) {
      return { available: false, reason: 'Facility is closed on this date' };
    }

    // Check if time is within operating hours
    if (!this.isTimeWithinRange(startTime, endTime, effectiveHours.openTime!, effectiveHours.closeTime!)) {
      return { available: false, reason: 'Time is outside operating hours' };
    }

    // Check Redis lock
    const lockKey = this.getSlotLockKey(courtId, date, startTime);
    const isLocked = await this.redisService.exists(lockKey);
    if (isLocked) {
      return { available: false, reason: 'Slot is being reserved by another user' };
    }

    // Check for overlapping bookings
    const overlappingBooking = await this.findOverlappingBooking(
      courtId,
      targetDate,
      startTime,
      endTime,
    );

    if (overlappingBooking) {
      return { available: false, reason: 'Slot is already booked' };
    }

    return { available: true };
  }

  /**
   * Lock a slot for payment (Redis lock for race condition prevention)
   */
  async lockSlot(
    courtId: string,
    date: string,
    startTime: string,
    durationMinutes: number = 60,
  ): Promise<SlotLockResponseDto> {
    // First check if slot is available
    const availability = await this.checkSlotAvailable(
      courtId,
      date,
      startTime,
      durationMinutes,
    );

    if (!availability.available) {
      throw new ConflictException(availability.reason || 'Slot is not available');
    }

    // Get court to find tenantId for socket emission
    const court = await this.prisma.court.findUnique({
      where: { id: courtId },
      select: { tenantId: true, facilityId: true },
    });

    // Generate lock token
    const lockToken = `lock_${uuidv4()}`;
    const lockKey = this.getSlotLockKey(courtId, date, startTime);

    // Try to acquire lock (using SETNX-like behavior)
    const lockData = JSON.stringify({
      lockToken,
      courtId,
      date,
      startTime,
      durationMinutes,
      userId: this.tenantContext.getUserId(),
      createdAt: new Date().toISOString(),
    });

    const acquired = await this.redisService.setNx(lockKey, lockData, SLOT_LOCK_TTL_SECONDS);

    if (!acquired) {
      throw new ConflictException('Slot is being reserved by another user');
    }

    // Store lock token mapping for easy unlock
    const tokenKey = `${SLOT_LOCK_PREFIX}token:${lockToken}`;
    await this.redisService.set(tokenKey, lockKey, SLOT_LOCK_TTL_SECONDS);

    const expiresAt = new Date(Date.now() + SLOT_LOCK_TTL_SECONDS * 1000);

    this.logger.log(`Slot locked: ${courtId}/${date}/${startTime} - Token: ${lockToken}`);

    // Emit WebSocket event for real-time calendar updates
    if (court?.tenantId) {
      this.wsGateway.emitToTenant(court.tenantId, 'slot:locked', {
        courtId,
        date,
        startTime,
        facilityId: court.facilityId,
      });
    }

    return {
      lockToken,
      expiresAt,
      durationSeconds: SLOT_LOCK_TTL_SECONDS,
    };
  }

  /**
   * Release a slot lock
   */
  async unlockSlot(lockToken: string): Promise<{ success: boolean }> {
    const tokenKey = `${SLOT_LOCK_PREFIX}token:${lockToken}`;
    const lockKey = await this.redisService.get(tokenKey);

    if (!lockKey) {
      // Lock may have already expired
      this.logger.warn(`Lock token not found or expired: ${lockToken}`);
      return { success: false };
    }

    // Get lock data before deleting for socket emission
    const lockDataStr = await this.redisService.get(lockKey);
    let lockData: { courtId: string; date: string; startTime: string } | null = null;
    if (lockDataStr) {
      try {
        lockData = JSON.parse(lockDataStr);
      } catch {
        // Ignore parse errors
      }
    }

    // Delete both keys
    await Promise.all([
      this.redisService.del(lockKey),
      this.redisService.del(tokenKey),
    ]);

    this.logger.log(`Slot unlocked: Token: ${lockToken}`);

    // Emit WebSocket event for real-time calendar updates
    if (lockData?.courtId) {
      const court = await this.prisma.court.findUnique({
        where: { id: lockData.courtId },
        select: { tenantId: true, facilityId: true },
      });

      if (court?.tenantId) {
        this.wsGateway.emitToTenant(court.tenantId, 'slot:unlocked', {
          courtId: lockData.courtId,
          date: lockData.date,
          startTime: lockData.startTime,
          facilityId: court.facilityId,
        });
      }
    }

    return { success: true };
  }

  /**
   * Validate a lock token and get lock data
   */
  async validateLockToken(lockToken: string): Promise<{
    valid: boolean;
    lockData?: {
      courtId: string;
      date: string;
      startTime: string;
      durationMinutes: number;
    };
  }> {
    const tokenKey = `${SLOT_LOCK_PREFIX}token:${lockToken}`;
    const lockKey = await this.redisService.get(tokenKey);

    if (!lockKey) {
      return { valid: false };
    }

    const lockDataStr = await this.redisService.get(lockKey);
    if (!lockDataStr) {
      return { valid: false };
    }

    try {
      const lockData = JSON.parse(lockDataStr);
      return {
        valid: true,
        lockData: {
          courtId: lockData.courtId,
          date: lockData.date,
          startTime: lockData.startTime,
          durationMinutes: lockData.durationMinutes,
        },
      };
    } catch {
      return { valid: false };
    }
  }

  // ==========================================
  // Private Helper Methods
  // ==========================================

  /**
   * Generate time slots for a specific court
   */
  private generateSlotsForCourt(
    court: {
      id: string;
      name: string;
      basePricePerHour: Prisma.Decimal;
    },
    targetDate: Date,
    dateStr: string,
    openTime: string,
    closeTime: string,
    sessionDurationMinutes: number,
    bufferMinutes: number,
    bookings: Array<{
      id: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      status: BookingStatus;
      customerName: string;
      customerPhone: string;
    }>,
    lockedSlots: Array<{ startTime: string }>,
  ): TimeSlotResponseDto[] {
    const slots: TimeSlotResponseDto[] = [];

    // Parse times to minutes for easier calculation
    const openMinutes = this.timeToMinutes(openTime);
    const closeMinutes = this.timeToMinutes(closeTime);
    const slotDuration = sessionDurationMinutes;
    const buffer = bufferMinutes;

    // Generate slots
    let currentMinutes = openMinutes;

    while (currentMinutes + slotDuration <= closeMinutes) {
      const startTime = this.minutesToTime(currentMinutes);
      const endTime = this.minutesToTime(currentMinutes + slotDuration);

      // Check if this slot overlaps with a booking
      const booking = this.findBookingForSlot(bookings, startTime, endTime);

      // Check if this slot is locked
      const isLocked = lockedSlots.some((l) => l.startTime === startTime);

      // Determine slot status
      let status: BookingStatus = BookingStatus.AVAILABLE;
      let bookingId: string | undefined;

      if (booking) {
        status = booking.status;
        bookingId = booking.id;
      } else if (isLocked) {
        // Slot is locked but not booked yet - mark as reserved
        status = BookingStatus.RESERVED;
      }

      // Calculate price (base price per hour, adjusted for duration)
      const pricePerHour = Number(court.basePricePerHour);
      const price = (pricePerHour / 60) * slotDuration;

      slots.push({
        courtId: court.id,
        courtName: court.name,
        date: dateStr,
        startTime,
        endTime,
        durationMinutes: slotDuration,
        isAvailable: status === BookingStatus.AVAILABLE,
        status,
        bookingId,
        booking: booking
          ? {
              id: booking.id,
              tenantId: '',
              facilityId: '',
              courtId: court.id,
              date: targetDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              durationMinutes: booking.durationMinutes,
              status: booking.status,
              customerName: booking.customerName,
              customerPhone: booking.customerPhone,
              customerEmail: null,
              totalPrice: 0,
              depositAmount: 0,
              depositPaid: false,
              depositPaidAt: null,
              balanceAmount: 0,
              balancePaid: false,
              balancePaidAt: null,
              notes: null,
              cancelledAt: null,
              cancellationReason: null,
              noShowMarkedAt: null,
              confirmedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          : undefined,
        price,
        isLocked,
      });

      // Move to next slot (include buffer)
      currentMinutes += slotDuration + buffer;
    }

    return slots;
  }

  /**
   * Find booking that overlaps with a time slot
   */
  private findBookingForSlot(
    bookings: Array<{
      id: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      status: BookingStatus;
      customerName: string;
      customerPhone: string;
    }>,
    slotStart: string,
    slotEnd: string,
  ): (typeof bookings)[0] | undefined {
    const slotStartMinutes = this.timeToMinutes(slotStart);
    const slotEndMinutes = this.timeToMinutes(slotEnd);

    return bookings.find((booking) => {
      const bookingStartMinutes = this.timeToMinutes(booking.startTime);
      const bookingEndMinutes = this.timeToMinutes(booking.endTime);

      // Check for overlap
      return (
        (bookingStartMinutes >= slotStartMinutes && bookingStartMinutes < slotEndMinutes) ||
        (bookingEndMinutes > slotStartMinutes && bookingEndMinutes <= slotEndMinutes) ||
        (bookingStartMinutes <= slotStartMinutes && bookingEndMinutes >= slotEndMinutes)
      );
    });
  }

  /**
   * Find overlapping booking in database
   */
  private async findOverlappingBooking(
    courtId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<{ id: string } | null> {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // Get all bookings for the court and date
    const bookings = await this.prisma.booking.findMany({
      where: {
        courtId,
        date,
        status: {
          notIn: [BookingStatus.CANCELLED],
        },
        ...(excludeBookingId && { id: { not: excludeBookingId } }),
      },
      select: { id: true, startTime: true, endTime: true },
    });

    // Check for overlaps
    for (const booking of bookings) {
      const bookingStartMinutes = this.timeToMinutes(booking.startTime);
      const bookingEndMinutes = this.timeToMinutes(booking.endTime);

      // Overlap exists if:
      // - New slot starts during existing booking
      // - New slot ends during existing booking
      // - New slot completely contains existing booking
      const hasOverlap =
        (startMinutes >= bookingStartMinutes && startMinutes < bookingEndMinutes) ||
        (endMinutes > bookingStartMinutes && endMinutes <= bookingEndMinutes) ||
        (startMinutes <= bookingStartMinutes && endMinutes >= bookingEndMinutes);

      if (hasOverlap) {
        return { id: booking.id };
      }
    }

    return null;
  }

  /**
   * Get locked slots from Redis for a date
   */
  private async getLockedSlotsForDate(
    courtIds: string[],
    date: string,
  ): Promise<Array<{ courtId: string; startTime: string }>> {
    const lockedSlots: Array<{ courtId: string; startTime: string }> = [];

    for (const courtId of courtIds) {
      // Scan for keys matching pattern lock:slot:{courtId}:{date}:*
      const pattern = `${SLOT_LOCK_PREFIX}${courtId}:${date}:*`;
      const keys = await this.redisService.keys(pattern);

      for (const key of keys) {
        // Extract start time from key
        const parts = key.split(':');
        const startTime = parts[parts.length - 1];

        lockedSlots.push({ courtId, startTime });
      }
    }

    return lockedSlots;
  }

  /**
   * Get Redis key for slot lock
   */
  private getSlotLockKey(courtId: string, date: string, startTime: string): string {
    return `${SLOT_LOCK_PREFIX}${courtId}:${date}:${startTime}`;
  }

  /**
   * Convert time string (HH:mm) to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string (HH:mm)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Add minutes to a time string
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * Check if a time range is within operating hours
   */
  private isTimeWithinRange(
    startTime: string,
    endTime: string,
    openTime: string,
    closeTime: string,
  ): boolean {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const openMinutes = this.timeToMinutes(openTime);
    const closeMinutes = this.timeToMinutes(closeTime);

    return startMinutes >= openMinutes && endMinutes <= closeMinutes;
  }
}
