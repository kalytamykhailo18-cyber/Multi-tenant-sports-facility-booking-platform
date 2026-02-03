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
import { Roles } from '../../common/decorators';
import { FacilitiesService } from './facilities.service';
import {
  CreateFacilityDto,
  UpdateFacilityDto,
  QueryFacilityDto,
  FacilityResponseDto,
  FacilityListResponseDto,
  UpdateWhatsAppCredentialsDto,
  UpdateMercadoPagoCredentialsDto,
  UpdateGeminiCredentialsDto,
  UpdateWhisperCredentialsDto,
  TestCredentialsResultDto,
  CredentialType,
  QrCodeResponseDto,
  GenerateQrCodeDto,
} from './dto';

@ApiTags('Facilities')
@ApiBearerAuth()
@Controller('facilities')
export class FacilitiesController {
  constructor(private readonly facilitiesService: FacilitiesService) {}

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

  /**
   * Update WhatsApp credentials
   */
  @Patch(':id/credentials/whatsapp')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update WhatsApp API credentials' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiBody({ type: UpdateWhatsAppCredentialsDto })
  @ApiResponse({
    status: 200,
    description: 'Credentials updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async updateWhatsAppCredentials(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppCredentialsDto,
  ): Promise<{ message: string }> {
    return this.facilitiesService.updateCredentials(id, 'whatsapp', dto);
  }

  /**
   * Update Mercado Pago credentials
   */
  @Patch(':id/credentials/mercadopago')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update Mercado Pago API credentials' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiBody({ type: UpdateMercadoPagoCredentialsDto })
  @ApiResponse({
    status: 200,
    description: 'Credentials updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async updateMercadoPagoCredentials(
    @Param('id') id: string,
    @Body() dto: UpdateMercadoPagoCredentialsDto,
  ): Promise<{ message: string }> {
    return this.facilitiesService.updateCredentials(id, 'mercadopago', dto);
  }

  /**
   * Update Gemini AI credentials
   */
  @Patch(':id/credentials/gemini')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update Gemini AI API key' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiBody({ type: UpdateGeminiCredentialsDto })
  @ApiResponse({
    status: 200,
    description: 'Credentials updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async updateGeminiCredentials(
    @Param('id') id: string,
    @Body() dto: UpdateGeminiCredentialsDto,
  ): Promise<{ message: string }> {
    return this.facilitiesService.updateCredentials(id, 'gemini', dto);
  }

  /**
   * Update Whisper (Speech-to-text) credentials
   */
  @Patch(':id/credentials/whisper')
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update Whisper/OpenAI API key' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiBody({ type: UpdateWhisperCredentialsDto })
  @ApiResponse({
    status: 200,
    description: 'Credentials updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async updateWhisperCredentials(
    @Param('id') id: string,
    @Body() dto: UpdateWhisperCredentialsDto,
  ): Promise<{ message: string }> {
    return this.facilitiesService.updateCredentials(id, 'whisper', dto);
  }

  /**
   * Test WhatsApp credentials
   */
  @Post(':id/credentials/whatsapp/test')
  @Roles('SUPER_ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test WhatsApp API credentials' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
    type: TestCredentialsResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async testWhatsAppCredentials(@Param('id') id: string): Promise<TestCredentialsResultDto> {
    return this.facilitiesService.testCredentials(id, 'whatsapp');
  }

  /**
   * Test Mercado Pago credentials
   */
  @Post(':id/credentials/mercadopago/test')
  @Roles('SUPER_ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test Mercado Pago API credentials' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
    type: TestCredentialsResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async testMercadoPagoCredentials(@Param('id') id: string): Promise<TestCredentialsResultDto> {
    return this.facilitiesService.testCredentials(id, 'mercadopago');
  }

  /**
   * Test Gemini AI credentials
   */
  @Post(':id/credentials/gemini/test')
  @Roles('SUPER_ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test Gemini AI API key' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
    type: TestCredentialsResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async testGeminiCredentials(@Param('id') id: string): Promise<TestCredentialsResultDto> {
    return this.facilitiesService.testCredentials(id, 'gemini');
  }

  /**
   * Test Whisper credentials
   */
  @Post(':id/credentials/whisper/test')
  @Roles('SUPER_ADMIN', 'OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test Whisper/OpenAI API key' })
  @ApiParam({ name: 'id', description: 'Facility ID' })
  @ApiResponse({
    status: 200,
    description: 'Test result',
    type: TestCredentialsResultDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Facility not found' })
  async testWhisperCredentials(@Param('id') id: string): Promise<TestCredentialsResultDto> {
    return this.facilitiesService.testCredentials(id, 'whisper');
  }

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
