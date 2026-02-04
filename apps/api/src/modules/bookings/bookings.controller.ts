// Bookings Controller
// REST API endpoints for booking management

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto, CancelBookingDto, ChangeBookingStatusDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { BookingResponseDto, BookingListResponseDto, CancellationResultDto } from './dto/booking-response.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Create a new booking
   */
  @Post()
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  @ApiResponse({ status: 409, description: 'Slot is not available' })
  async create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.bookingsService.create(dto);
  }

  /**
   * Get all bookings with pagination and filters
   */
  @Get()
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'List bookings with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: BookingListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryBookingDto): Promise<BookingListResponseDto> {
    return this.bookingsService.findAll(query);
  }

  /**
   * Get bookings by date range for calendar view
   */
  @Get('facility/:facilityId/range')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get bookings for a facility within a date range' })
  @ApiParam({ name: 'facilityId', description: 'Facility ID' })
  @ApiQuery({ name: 'startDate', description: 'Start date (YYYY-MM-DD)', example: '2026-02-01' })
  @ApiQuery({ name: 'endDate', description: 'End date (YYYY-MM-DD)', example: '2026-02-28' })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
    type: [BookingResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async findByDateRange(
    @Param('facilityId') facilityId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<BookingResponseDto[]> {
    return this.bookingsService.findByDateRange(facilityId, startDate, endDate);
  }

  /**
   * Get a single booking by ID
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking found',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findById(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingsService.findById(id);
  }

  /**
   * Update a booking
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Update booking details (reschedule, update customer info, etc.)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or booking cannot be updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  @ApiResponse({ status: 409, description: 'New slot is not available (if rescheduling)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.update(id, dto);
  }

  /**
   * Cancel a booking
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully. Returns cancellation result with credit info if applicable.',
    type: CancellationResultDto,
  })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot cancel this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancel(
    @Param('id') id: string,
    @Body() dto?: CancelBookingDto,
  ): Promise<CancellationResultDto> {
    return this.bookingsService.cancel(id, dto);
  }

  /**
   * Change booking status
   */
  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Change booking status' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking status changed successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeBookingStatusDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.changeStatus(id, dto);
  }

  /**
   * Mark booking as completed
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Mark booking as completed' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking marked as completed',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async markCompleted(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingsService.markCompleted(id);
  }

  /**
   * Mark booking as no-show
   */
  @Post(':id/no-show')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Mark booking as no-show (customer did not attend)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking marked as no-show',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async markNoShow(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingsService.markNoShow(id);
  }

  /**
   * Mark booking as confirmed (customer confirmed attendance)
   */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Mark booking as confirmed (customer confirmed attendance)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking marked as confirmed',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async markConfirmed(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.bookingsService.markConfirmed(id);
  }
}
