// Credits Controller
// REST API endpoints for credit management

import {
  Controller,
  Get,
  Post,
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
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { QueryCreditDto } from './dto/query-credit.dto';
import { CreditResponseDto, CreditListResponseDto, CustomerCreditBalanceDto, ApplyCreditResultDto } from './dto/credit-response.dto';
import { UseCreditDto, DeactivateCreditDto } from './dto/use-credit.dto';

@ApiTags('Credits')
@ApiBearerAuth()
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  /**
   * Create a new credit for a customer
   */
  @Post()
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({
    summary: 'Create customer credit',
    description:
      'Creates a manual credit for a customer. Use this for refunds, promotional credits, or manual adjustments.',
  })
  @ApiResponse({
    status: 201,
    description: 'Credit created successfully',
    type: CreditResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(@Body() dto: CreateCreditDto): Promise<CreditResponseDto> {
    return this.creditsService.create(dto);
  }

  /**
   * Get all credits with pagination and filters
   */
  @Get()
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'List credits',
    description: 'Get all credits for the current tenant with pagination and filtering options.',
  })
  @ApiResponse({
    status: 200,
    description: 'Credits retrieved successfully',
    type: CreditListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - tenant context required' })
  async findAll(@Query() query: QueryCreditDto): Promise<CreditListResponseDto> {
    return this.creditsService.findAll(query);
  }

  /**
   * Get customer's credit balance
   */
  @Get('customer/:customerId/balance')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get customer credit balance',
    description:
      'Get the total available credit balance for a customer, including all active credits.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit balance retrieved',
    type: CustomerCreditBalanceDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this customer' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getCustomerBalance(
    @Param('customerId') customerId: string,
  ): Promise<CustomerCreditBalanceDto> {
    return this.creditsService.getCustomerBalance(customerId);
  }

  /**
   * Apply credits to a booking
   */
  @Post('use')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Use customer credits',
    description:
      'Apply customer credits to a booking payment. Uses oldest credits first (FIFO) unless specific credit IDs are provided.',
  })
  @ApiResponse({
    status: 200,
    description: 'Credits applied successfully',
    type: ApplyCreditResultDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or no credits available' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - tenant context required' })
  async useCredits(@Body() dto: UseCreditDto): Promise<ApplyCreditResultDto> {
    return this.creditsService.useCredits(dto);
  }

  /**
   * Get a single credit by ID
   */
  @Get(':id')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get credit by ID',
    description: 'Retrieve a specific credit record by its ID.',
  })
  @ApiParam({ name: 'id', description: 'Credit ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit found',
    type: CreditResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot access this credit' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async findById(@Param('id') id: string): Promise<CreditResponseDto> {
    return this.creditsService.findById(id);
  }

  /**
   * Deactivate a credit
   */
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPER_ADMIN', 'OWNER')
  @ApiOperation({
    summary: 'Deactivate credit',
    description:
      'Deactivates a credit, making it unusable for future bookings. The remaining balance will be lost.',
  })
  @ApiParam({ name: 'id', description: 'Credit ID' })
  @ApiResponse({
    status: 200,
    description: 'Credit deactivated',
    type: CreditResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - cannot deactivate this credit' })
  @ApiResponse({ status: 404, description: 'Credit not found' })
  async deactivate(
    @Param('id') id: string,
    @Body() dto?: DeactivateCreditDto,
  ): Promise<CreditResponseDto> {
    return this.creditsService.deactivate(id, dto?.reason);
  }

  /**
   * Get credits created from a specific booking
   */
  @Get('booking/:bookingId')
  @Roles('SUPER_ADMIN', 'OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get credits for booking',
    description: 'Retrieve all credits that were created from a specific booking (e.g., from cancellation).',
  })
  @ApiParam({ name: 'bookingId', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Credits retrieved successfully',
    type: [CreditResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - tenant context required' })
  async getCreditsForBooking(@Param('bookingId') bookingId: string): Promise<CreditResponseDto[]> {
    return this.creditsService.getCreditsForBooking(bookingId);
  }
}
