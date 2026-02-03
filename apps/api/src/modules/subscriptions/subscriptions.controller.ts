// Subscriptions Controller
// REST API endpoints for subscription management

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
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  QuerySubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionListResponseDto,
} from './dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Create a new subscription
   */
  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new subscription for a tenant' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Tenant already has an active subscription' })
  async create(@Body() dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.create(dto);
  }

  /**
   * Get all subscriptions with pagination and filters
   */
  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List subscriptions with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Subscriptions retrieved successfully',
    type: SubscriptionListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  async findAll(@Query() query: QuerySubscriptionDto): Promise<SubscriptionListResponseDto> {
    return this.subscriptionsService.findAll(query);
  }

  /**
   * Get subscription by ID
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription found',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async findById(@Param('id') id: string): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.findById(id);
  }

  /**
   * Get subscription by tenant ID
   */
  @Get('tenant/:tenantId')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Get subscription by tenant ID' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription found',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByTenantId(@Param('tenantId') tenantId: string): Promise<SubscriptionResponseDto | null> {
    return this.subscriptionsService.findByTenantId(tenantId);
  }

  /**
   * Update subscription details
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update subscription details' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.update(id, dto);
  }

  /**
   * Suspend a subscription
   */
  @Post(':id/suspend')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription suspended',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Subscription already suspended' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async suspend(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.suspend(id, body.reason);
  }

  /**
   * Reactivate a suspended subscription
   */
  @Post(':id/reactivate')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a suspended subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription reactivated',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Subscription already active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async reactivate(@Param('id') id: string): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.reactivate(id);
  }

  /**
   * Cancel a subscription
   */
  @Post(':id/cancel')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.cancel(id, body.reason);
  }

  /**
   * Trigger status check (for testing - normally called by cron job)
   */
  @Post('check-statuses')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger subscription status check (admin utility)' })
  @ApiResponse({
    status: 200,
    description: 'Status check completed',
    schema: {
      type: 'object',
      properties: {
        updated: { type: 'number' },
        suspended: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  async checkStatuses(): Promise<{ updated: number; suspended: number }> {
    return this.subscriptionsService.checkAndUpdateStatuses();
  }
}
