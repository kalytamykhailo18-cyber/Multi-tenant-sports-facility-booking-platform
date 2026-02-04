// Customers Controller
// REST API endpoints for customer management

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CustomerDetailsDto, CustomerWithRelationsDto, CustomerNoteDto, ReputationHistoryDto, PaginatedCustomersDto } from './dto/customer-response.dto';
import { AddCustomerNoteDto } from './dto/customer-note.dto';
import { UpdateReputationDto } from './dto/update-reputation.dto';
import { AddCreditDto } from './dto/add-credit.dto';
import { BlockCustomerDto } from './dto/block-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Extended request type with user info
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
  };
}

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created', type: CustomerDetailsDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Customer with this phone already exists' })
  async create(@Body() dto: CreateCustomerDto): Promise<CustomerDetailsDto> {
    return this.customersService.create(dto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all customers with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of customers', type: PaginatedCustomersDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'reputationLevel', required: false, enum: ['GOOD', 'CAUTION', 'POOR'] })
  @ApiQuery({ name: 'isBlocked', required: false, type: Boolean })
  @ApiQuery({ name: 'hasCredit', required: false, type: Boolean })
  @ApiQuery({ name: 'hasBookingAfter', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: QueryCustomerDto): Promise<PaginatedCustomersDto> {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get customer by ID with relations' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer details', type: CustomerWithRelationsDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findById(@Param('id') id: string): Promise<CustomerWithRelationsDto> {
    return this.customersService.findById(id);
  }

  @Get('phone/:phone')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get customer by phone number' })
  @ApiParam({ name: 'phone', description: 'Customer phone number' })
  @ApiResponse({ status: 200, description: 'Customer details or null', type: CustomerDetailsDto })
  async findByPhone(@Param('phone') phone: string): Promise<CustomerDetailsDto | null> {
    return this.customersService.findByPhone(phone);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Update customer information' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer updated', type: CustomerDetailsDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerDetailsDto> {
    return this.customersService.update(id, dto);
  }

  @Post(':id/block')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Block or unblock a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer block status updated', type: CustomerDetailsDto })
  @ApiResponse({ status: 400, description: 'Reason required when blocking' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async setBlocked(
    @Param('id') id: string,
    @Body() dto: BlockCustomerDto,
  ): Promise<CustomerDetailsDto> {
    return this.customersService.setBlocked(id, dto);
  }

  @Post(':id/reputation')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Manually update customer reputation score' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Reputation updated', type: CustomerDetailsDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateReputation(
    @Param('id') id: string,
    @Body() dto: UpdateReputationDto,
  ): Promise<CustomerDetailsDto> {
    return this.customersService.updateReputation(id, dto);
  }

  @Post(':id/credit')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Add credit to customer account' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Credit added', type: CustomerDetailsDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async addCredit(
    @Param('id') id: string,
    @Body() dto: AddCreditDto,
  ): Promise<CustomerDetailsDto> {
    return this.customersService.addCredit(id, dto);
  }

  @Post(':id/notes')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add a note to customer profile' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiResponse({ status: 201, description: 'Note added', type: CustomerNoteDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddCustomerNoteDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CustomerNoteDto> {
    return this.customersService.addNote(id, dto, req.user?.id);
  }

  @Get(':id/notes')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get customer notes' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max notes to return' })
  @ApiResponse({ status: 200, description: 'Customer notes', type: [CustomerNoteDto] })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getNotes(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<CustomerNoteDto[]> {
    return this.customersService.getNotes(id, limit ? Number(limit) : 20);
  }

  @Get(':id/reputation-history')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get customer reputation history' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max entries to return' })
  @ApiResponse({ status: 200, description: 'Reputation history', type: [ReputationHistoryDto] })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getReputationHistory(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ): Promise<ReputationHistoryDto[]> {
    return this.customersService.getReputationHistory(id, limit ? Number(limit) : 20);
  }
}
