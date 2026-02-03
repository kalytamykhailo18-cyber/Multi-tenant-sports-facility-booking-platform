// Dashboard Controller
// REST API endpoints for owner dashboard data

import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles, TenantId } from '../../common/decorators';
import { DashboardService } from './dashboard.service';
import {
  DashboardStatsResponseDto,
  DashboardAlertsResponseDto,
  DashboardUpcomingResponseDto,
} from './dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard statistics
   */
  @Get('stats')
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Returns aggregated statistics for the owner dashboard including today\'s bookings, weekly revenue, cancellation rate, and subscription status.',
  })
  @ApiQuery({
    name: 'facilityId',
    required: false,
    description: 'Filter by specific facility ID (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getStats(
    @TenantId() tenantId: string,
    @Query('facilityId') facilityId?: string,
  ): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getStats(tenantId, facilityId);
  }

  /**
   * Get dashboard alerts
   */
  @Get('alerts')
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get dashboard alerts',
    description: 'Returns alerts requiring attention including unconfirmed bookings, pending escalations, payment issues, and subscription reminders.',
  })
  @ApiQuery({
    name: 'facilityId',
    required: false,
    description: 'Filter by specific facility ID (optional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard alerts retrieved successfully',
    type: DashboardAlertsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getAlerts(
    @TenantId() tenantId: string,
    @Query('facilityId') facilityId?: string,
  ): Promise<DashboardAlertsResponseDto> {
    return this.dashboardService.getAlerts(tenantId, facilityId);
  }

  /**
   * Get upcoming bookings
   */
  @Get('upcoming')
  @Roles('OWNER', 'STAFF', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get upcoming bookings',
    description: 'Returns the next upcoming bookings for the facility with customer and court details.',
  })
  @ApiQuery({
    name: 'facilityId',
    required: false,
    description: 'Filter by specific facility ID (optional)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of bookings to return (default: 5)',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Upcoming bookings retrieved successfully',
    type: DashboardUpcomingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getUpcoming(
    @TenantId() tenantId: string,
    @Query('facilityId') facilityId?: string,
    @Query('limit') limit?: number,
  ): Promise<DashboardUpcomingResponseDto> {
    return this.dashboardService.getUpcoming(tenantId, facilityId, limit || 5);
  }
}
