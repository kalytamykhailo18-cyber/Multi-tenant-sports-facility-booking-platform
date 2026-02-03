// Operating Hours Controller
// REST API endpoints for operating hours and special hours management

import {
  Controller,
  Get,
  Post,
  Put,
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
import { Roles } from '../../common/decorators';
import { OperatingHoursService } from './operating-hours.service';
import {
  UpdateOperatingHoursDto,
  BulkUpdateOperatingHoursDto,
  OperatingHoursResponseDto,
  WeeklyScheduleResponseDto,
  CreateSpecialHoursDto,
  UpdateSpecialHoursDto,
  SpecialHoursResponseDto,
  SpecialHoursListResponseDto,
  QuerySpecialHoursDto,
} from './dto';

@ApiTags('Operating Hours')
@ApiBearerAuth()
@Controller('operating-hours')
export class OperatingHoursController {
  constructor(private readonly operatingHoursService: OperatingHoursService) {}

  // ==========================================
  // Operating Hours Endpoints
  // ==========================================

  /**
   * Get operating hours for a facility
   */
  @Get('facility/:facilityId')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get weekly operating hours for a facility' })
  @ApiParam({ name: 'facilityId', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Operating hours retrieved successfully',
    type: WeeklyScheduleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async findByFacility(
    @Param('facilityId') facilityId: string,
  ): Promise<WeeklyScheduleResponseDto> {
    return this.operatingHoursService.findByFacility(facilityId);
  }

  /**
   * Update a single day's operating hours
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update operating hours for a specific day' })
  @ApiParam({ name: 'id', description: 'Operating hours ID' })
  @ApiResponse({
    status: 200,
    description: 'Operating hours updated successfully',
    type: OperatingHoursResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update these operating hours' })
  @ApiResponse({ status: 404, description: 'Operating hours not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOperatingHoursDto,
  ): Promise<OperatingHoursResponseDto> {
    return this.operatingHoursService.update(id, dto);
  }

  /**
   * Bulk update operating hours for a facility (all days at once)
   */
  @Put('facility/:facilityId')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update weekly schedule for a facility (all days)' })
  @ApiParam({ name: 'facilityId', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Weekly schedule updated successfully',
    type: WeeklyScheduleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update operating hours for this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async bulkUpdate(
    @Param('facilityId') facilityId: string,
    @Body() dto: BulkUpdateOperatingHoursDto,
  ): Promise<WeeklyScheduleResponseDto> {
    return this.operatingHoursService.bulkUpdate(facilityId, dto);
  }

  /**
   * Create default operating hours for a facility
   */
  @Post('facility/:facilityId/defaults')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create default operating hours for a new facility' })
  @ApiParam({ name: 'facilityId', description: 'Facility ID' })
  @ApiResponse({
    status: 201,
    description: 'Default operating hours created successfully',
    type: [OperatingHoursResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Operating hours already exist for this facility' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot create operating hours for this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async createDefaults(
    @Param('facilityId') facilityId: string,
  ): Promise<OperatingHoursResponseDto[]> {
    return this.operatingHoursService.createDefaultHours(facilityId);
  }

  // ==========================================
  // Special Hours Endpoints
  // ==========================================

  /**
   * Get special hours for a facility
   */
  @Get('facility/:facilityId/special')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get special hours (holidays, closures) for a facility' })
  @ApiParam({ name: 'facilityId', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Special hours retrieved successfully',
    type: SpecialHoursListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async findSpecialHoursByFacility(
    @Param('facilityId') facilityId: string,
    @Query() query: QuerySpecialHoursDto,
  ): Promise<SpecialHoursListResponseDto> {
    return this.operatingHoursService.findSpecialHoursByFacility(facilityId, query);
  }

  /**
   * Create special hours (holiday/closure)
   */
  @Post('special')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create special hours for a specific date (holiday/closure)' })
  @ApiResponse({
    status: 201,
    description: 'Special hours created successfully',
    type: SpecialHoursResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or special hours already exist for this date' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot create special hours for this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async createSpecialHours(
    @Body() dto: CreateSpecialHoursDto,
  ): Promise<SpecialHoursResponseDto> {
    return this.operatingHoursService.createSpecialHours(dto);
  }

  /**
   * Update special hours
   */
  @Patch('special/:id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update special hours' })
  @ApiParam({ name: 'id', description: 'Special hours ID' })
  @ApiResponse({
    status: 200,
    description: 'Special hours updated successfully',
    type: SpecialHoursResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update these special hours' })
  @ApiResponse({ status: 404, description: 'Special hours not found' })
  async updateSpecialHours(
    @Param('id') id: string,
    @Body() dto: UpdateSpecialHoursDto,
  ): Promise<SpecialHoursResponseDto> {
    return this.operatingHoursService.updateSpecialHours(id, dto);
  }

  /**
   * Delete special hours
   */
  @Delete('special/:id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete special hours' })
  @ApiParam({ name: 'id', description: 'Special hours ID' })
  @ApiResponse({
    status: 200,
    description: 'Special hours deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot delete these special hours' })
  @ApiResponse({ status: 404, description: 'Special hours not found' })
  async deleteSpecialHours(@Param('id') id: string): Promise<{ message: string }> {
    return this.operatingHoursService.deleteSpecialHours(id);
  }
}
