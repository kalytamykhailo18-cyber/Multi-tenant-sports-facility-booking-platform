// Time Slots Controller
// REST API endpoints for time slot management (calendar view and slot locking)

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { TimeSlotsService } from './time-slots.service';
import { QueryTimeSlotsDto, LockSlotDto, UnlockSlotDto } from './dto/query-booking.dto';
import { DaySlotsResponseDto, SlotLockResponseDto } from './dto/booking-response.dto';

@ApiTags('Time Slots')
@ApiBearerAuth()
@Controller('time-slots')
export class TimeSlotsController {
  constructor(private readonly timeSlotsService: TimeSlotsService) {}

  /**
   * Get all time slots for a facility on a specific date
   */
  @Get()
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get time slots for a facility on a specific date',
    description:
      'Returns all time slots for all courts (or a specific court) on the given date, including availability status and booking information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Time slots retrieved successfully',
    type: DaySlotsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async getDaySlots(@Query() query: QueryTimeSlotsDto): Promise<DaySlotsResponseDto> {
    return this.timeSlotsService.getDaySlots(query);
  }

  /**
   * Check if a specific slot is available
   */
  @Get('check-availability')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Check if a specific time slot is available',
    description:
      'Checks if the specified slot is available for booking, including checking for locks and existing bookings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability check completed',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', description: 'Whether the slot is available' },
        reason: { type: 'string', description: 'Reason if not available', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this court' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  async checkAvailability(
    @Query('courtId') courtId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('durationMinutes') durationMinutes?: number,
  ): Promise<{ available: boolean; reason?: string }> {
    return this.timeSlotsService.checkSlotAvailable(
      courtId,
      date,
      startTime,
      durationMinutes || 60,
    );
  }

  /**
   * Lock a time slot for payment
   */
  @Post('lock')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Lock a time slot for payment',
    description:
      'Temporarily locks a time slot while the user completes payment. Lock expires after 5 minutes. Returns a lock token that must be used to complete the booking.',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot locked successfully',
    type: SlotLockResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this court' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  @ApiResponse({ status: 409, description: 'Slot is not available or already locked' })
  async lockSlot(@Body() dto: LockSlotDto): Promise<SlotLockResponseDto> {
    return this.timeSlotsService.lockSlot(
      dto.courtId,
      dto.date,
      dto.startTime,
      dto.durationMinutes,
    );
  }

  /**
   * Unlock a time slot
   */
  @Post('unlock')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Unlock a previously locked time slot',
    description:
      'Releases a slot lock, typically called if the user abandons the payment process.',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot unlocked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'Whether the unlock was successful' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unlockSlot(@Body() dto: UnlockSlotDto): Promise<{ success: boolean }> {
    return this.timeSlotsService.unlockSlot(dto.lockToken);
  }

  /**
   * Validate a lock token
   */
  @Get('validate-lock')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Validate a slot lock token',
    description:
      'Checks if a lock token is still valid and returns the lock data if so.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lock validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', description: 'Whether the lock is valid' },
        lockData: {
          type: 'object',
          nullable: true,
          properties: {
            courtId: { type: 'string' },
            date: { type: 'string' },
            startTime: { type: 'string' },
            durationMinutes: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validateLock(
    @Query('lockToken') lockToken: string,
  ): Promise<{
    valid: boolean;
    lockData?: {
      courtId: string;
      date: string;
      startTime: string;
      durationMinutes: number;
    };
  }> {
    return this.timeSlotsService.validateLockToken(lockToken);
  }
}
