// Courts Controller
// REST API endpoints for court management

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CourtsService } from './courts.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto, UpdateCourtStatusDto, ReorderCourtsDto } from './dto/update-court.dto';
import { QueryCourtDto } from './dto/query-court.dto';
import { CourtResponseDto, CourtListResponseDto } from './dto/court-response.dto';

@ApiTags('Courts')
@ApiBearerAuth()
@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  /**
   * Create a new court
   */
  @Post()
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new court' })
  @ApiResponse({
    status: 201,
    description: 'Court created successfully',
    type: CourtResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async create(@Body() dto: CreateCourtDto): Promise<CourtResponseDto> {
    return this.courtsService.create(dto);
  }

  /**
   * Get all courts with pagination and filters
   */
  @Get()
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'List courts with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Courts retrieved successfully',
    type: CourtListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryCourtDto): Promise<CourtListResponseDto> {
    return this.courtsService.findAll(query);
  }

  /**
   * Get courts by facility ID
   */
  @Get('facility/:facilityId')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get all courts for a specific facility' })
  @ApiParam({ name: 'facilityId', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Courts retrieved successfully',
    type: [CourtResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async findByFacility(@Param('facilityId') facilityId: string): Promise<CourtResponseDto[]> {
    return this.courtsService.findByFacility(facilityId);
  }

  /**
   * Get a single court by ID
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get court by ID' })
  @ApiParam({ name: 'id', description: 'Court ID' })
  @ApiResponse({
    status: 200,
    description: 'Court found',
    type: CourtResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this court' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  async findById(@Param('id') id: string): Promise<CourtResponseDto> {
    return this.courtsService.findById(id);
  }

  /**
   * Update a court
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update court details' })
  @ApiParam({ name: 'id', description: 'Court ID' })
  @ApiResponse({
    status: 200,
    description: 'Court updated successfully',
    type: CourtResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this court' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourtDto,
  ): Promise<CourtResponseDto> {
    return this.courtsService.update(id, dto);
  }

  /**
   * Update court status
   */
  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update court status (active, maintenance, inactive)' })
  @ApiParam({ name: 'id', description: 'Court ID' })
  @ApiResponse({
    status: 200,
    description: 'Court status updated successfully',
    type: CourtResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this court' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCourtStatusDto,
  ): Promise<CourtResponseDto> {
    return this.courtsService.updateStatus(id, dto);
  }

  /**
   * Reorder courts within a facility
   */
  @Patch('reorder')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Reorder courts within a facility' })
  @ApiResponse({
    status: 200,
    description: 'Courts reordered successfully',
    type: [CourtResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid court IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot reorder courts for this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async reorder(@Body() dto: ReorderCourtsDto): Promise<CourtResponseDto[]> {
    return this.courtsService.reorder(dto);
  }

  /**
   * Delete a court (soft delete - sets status to INACTIVE)
   */
  @Delete(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a court (soft delete)' })
  @ApiParam({ name: 'id', description: 'Court ID' })
  @ApiResponse({
    status: 200,
    description: 'Court deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot delete this court' })
  @ApiResponse({ status: 404, description: 'Court not found' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.courtsService.delete(id);
  }
}
