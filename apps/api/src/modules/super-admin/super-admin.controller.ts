// Super Admin Controller
// HTTP endpoints for platform-wide monitoring and facility management

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@sports-booking/database';
import { SuperAdminService } from './super-admin.service';
import {
  SuperAdminDashboardDto,
  FacilitySummaryDto,
  FacilityListDto,
  FacilityQueryDto,
} from './dto/dashboard.dto';

@ApiTags('Super Admin')
@ApiBearerAuth()
@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Returns platform-wide statistics including facilities, subscriptions, and revenue. Only accessible by Super Admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: SuperAdminDashboardDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not Super Admin',
  })
  async getDashboard(): Promise<SuperAdminDashboardDto> {
    return this.superAdminService.getDashboardStats();
  }

  @Get('facilities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all facilities with pagination',
    description:
      'Returns paginated list of all facilities with search, filter, and sort capabilities. Only accessible by Super Admin.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by facility name or city',
    example: 'Los Amigos',
  })
  @ApiQuery({
    name: 'subscriptionStatus',
    required: false,
    enum: ['ACTIVE', 'DUE_SOON', 'SUSPENDED'],
    description: 'Filter by subscription status',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    description: 'Filter by facility status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt', 'nextDueDate'],
    example: 'createdAt',
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort order',
  })
  @ApiResponse({
    status: 200,
    description: 'Facilities list retrieved successfully',
    type: FacilityListDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not Super Admin',
  })
  async getAllFacilities(
    @Query() query: FacilityQueryDto,
  ): Promise<FacilityListDto> {
    return this.superAdminService.getAllFacilities(query);
  }

  @Get('facilities/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get facility details by ID',
    description:
      'Returns detailed information for a specific facility. Only accessible by Super Admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'Facility ID',
    example: 'clx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Facility details retrieved successfully',
    type: FacilitySummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not Super Admin',
  })
  @ApiResponse({
    status: 404,
    description: 'Facility not found',
  })
  async getFacilityDetails(
    @Param('id') id: string,
  ): Promise<FacilitySummaryDto> {
    return this.superAdminService.getFacilityDetails(id);
  }
}
