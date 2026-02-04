// Tenants Controller
// Handles tenant management operations (Super Admin only)

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
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
import { TenantsService } from './tenants.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../auth/strategies/jwt.strategy';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { TenantResponseDto, TenantListResponseDto } from './dto/tenant-response.dto';

@ApiTags('Tenants')
@Controller('tenants')
@ApiBearerAuth()
export class TenantsController {
  private readonly logger = new Logger(TenantsController.name);

  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Get all tenants with pagination and filtering (Super Admin only)
   */
  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'List all tenants',
    description: 'Returns paginated list of all tenants with filters. Super Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of tenants',
    type: TenantListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  async findAll(@Query() query: QueryTenantDto): Promise<TenantListResponseDto> {
    this.logger.log(`Listing tenants with query: ${JSON.stringify(query)}`);
    return this.tenantsService.findAll(query);
  }

  /**
   * Get tenant by ID (Super Admin only)
   */
  @Get(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get tenant by ID',
    description: 'Returns a specific tenant by ID. Super Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findById(@Param('id') id: string): Promise<TenantResponseDto> {
    this.logger.log(`Getting tenant: ${id}`);
    return this.tenantsService.findById(id);
  }

  /**
   * Get tenant by slug (Super Admin only)
   */
  @Get('slug/:slug')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Get tenant by slug',
    description: 'Returns a specific tenant by slug. Super Admin only.',
  })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async findBySlug(@Param('slug') slug: string): Promise<TenantResponseDto> {
    this.logger.log(`Getting tenant by slug: ${slug}`);
    return this.tenantsService.findBySlug(slug);
  }

  /**
   * Create a new tenant (Super Admin only)
   */
  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Create tenant',
    description: 'Creates a new tenant. Super Admin only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
  async create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TenantResponseDto> {
    this.logger.log(`Creating tenant: ${dto.businessName} by user ${user.email}`);
    return this.tenantsService.create(dto);
  }

  /**
   * Update a tenant (Super Admin only)
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Update tenant',
    description: 'Updates an existing tenant. Super Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: RequestUser,
  ): Promise<TenantResponseDto> {
    this.logger.log(`Updating tenant ${id} by user ${user.email}`);
    return this.tenantsService.update(id, dto);
  }

  /**
   * Delete a tenant (Super Admin only)
   * Soft deletes if tenant has associated data, hard deletes otherwise
   */
  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete tenant',
    description: 'Deletes a tenant. Soft delete if has associated data, hard delete otherwise. Super Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting tenant ${id} by user ${user.email}`);
    return this.tenantsService.delete(id);
  }

  /**
   * Suspend a tenant (Super Admin only)
   */
  @Post(':id/suspend')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Suspend tenant',
    description: 'Suspends a tenant (sets status to SUSPENDED). Super Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant suspended successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - tenant already suspended' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async suspend(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: RequestUser,
  ): Promise<TenantResponseDto> {
    this.logger.log(`Suspending tenant ${id} by user ${user.email}. Reason: ${body.reason || 'Not provided'}`);
    return this.tenantsService.suspend(id, body.reason);
  }

  /**
   * Reactivate a suspended tenant (Super Admin only)
   */
  @Post(':id/reactivate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Reactivate tenant',
    description: 'Reactivates a suspended tenant (sets status to ACTIVE). Super Admin only.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'Tenant reactivated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - tenant already active' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires SUPER_ADMIN role' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async reactivate(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<TenantResponseDto> {
    this.logger.log(`Reactivating tenant ${id} by user ${user.email}`);
    return this.tenantsService.reactivate(id);
  }

  /**
   * Get users for a specific tenant (Super Admin only or own tenant)
   */
  @Get(':id/users')
  @ApiOperation({
    summary: 'Get tenant users',
    description: 'Returns all users for a specific tenant.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'List of users in the tenant',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access another tenant' })
  async getUsers(@Param('id') tenantId: string) {
    this.logger.log(`Getting users for tenant: ${tenantId}`);
    return this.tenantsService.getUsersForTenant(tenantId);
  }

  /**
   * Get facilities for a specific tenant (Super Admin only or own tenant)
   */
  @Get(':id/facilities')
  @ApiOperation({
    summary: 'Get tenant facilities',
    description: 'Returns all facilities for a specific tenant.',
  })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({
    status: 200,
    description: 'List of facilities in the tenant',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access another tenant' })
  async getFacilities(@Param('id') tenantId: string) {
    this.logger.log(`Getting facilities for tenant: ${tenantId}`);
    return this.tenantsService.getFacilitiesForTenant(tenantId);
  }
}
