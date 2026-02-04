// Facilities Controller
// REST API endpoints for facility management

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
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { FacilitiesService } from './facilities.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { QueryFacilityDto } from './dto/query-facility.dto';
import { FacilityResponseDto, FacilityListResponseDto } from './dto/facility-response.dto';
import { QrCodeResponseDto, GenerateQrCodeDto } from './dto/qr-code.dto';
import { RegisterFacilityDto, RegisterFacilityResponseDto } from './dto/register-facility.dto';

@ApiTags('Facilities')
@ApiBearerAuth()
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

  /**
   * Complete facility registration (Super Admin only)
   * Creates tenant + facility + owner user + subscription in one transaction
   */
  @Post('register')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Complete facility registration',
    description:
      'Creates a complete facility setup including tenant, facility, owner user, and subscription. Super Admin only.',
  })
  @ApiBody({ type: RegisterFacilityDto })
  @ApiResponse({
    status: 201,
    description: 'Facility registered successfully',
    type: RegisterFacilityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or registration failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  async register(@Body() dto: RegisterFacilityDto): Promise<RegisterFacilityResponseDto> {
    return this.facilitiesService.registerFacility(dto);
  }

  /**
   * Create a new facility
   */
  @Post()
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new facility' })
  @ApiResponse({
    status: 201,
    description: 'Facility created successfully',
    type: FacilityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async create(@Body() dto: CreateFacilityDto): Promise<FacilityResponseDto> {
    return this.facilitiesService.create(dto);
  }

  /**
   * Get all facilities with pagination and filters
   */
  @Get()
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'List facilities with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Facilities retrieved successfully',
    type: FacilityListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryFacilityDto): Promise<FacilityListResponseDto> {
    return this.facilitiesService.findAll(query);
  }

  /**
   * Get a single facility by ID
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get facility by ID' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Facility found',
    type: FacilityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async findById(@Param('id') id: string): Promise<FacilityResponseDto> {
    return this.facilitiesService.findById(id);
  }

  /**
   * Update a facility
   */
  @Patch(':id')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update facility details' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Facility updated successfully',
    type: FacilityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot update this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFacilityDto,
  ): Promise<FacilityResponseDto> {
    return this.facilitiesService.update(id, dto);
  }

  /**
   * Delete a facility
   */
  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a facility' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Facility deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot delete this facility' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.facilitiesService.delete(id);
  }

  // NOTE: Credential endpoints removed - now use OAuth controller for Mercado Pago
  // WhatsApp uses Baileys (QR code connection), AI keys are centralized (not per-facility)

  /**
   * Generate QR code for facility's WhatsApp
   */
  @Post(':id/qr-code')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate QR code for facility WhatsApp' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiBody({ type: GenerateQrCodeDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'QR code generated successfully',
    type: QrCodeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Facility has no WhatsApp number configured' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async generateQrCode(
    @Param('id') id: string,
    @Body() dto?: GenerateQrCodeDto,
  ): Promise<QrCodeResponseDto> {
    return this.facilitiesService.generateQrCode(id, dto);
  }
}
