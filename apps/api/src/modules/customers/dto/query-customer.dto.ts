// Query Customer DTO
// Validation for querying/filtering customers

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ReputationLevel } from '@prisma/client';

export class QueryCustomerDto {
  @ApiPropertyOptional({
    description: 'Search by name or phone',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by reputation level',
    enum: ReputationLevel,
    example: ReputationLevel.GOOD,
  })
  @IsOptional()
  @IsEnum(ReputationLevel)
  reputationLevel?: ReputationLevel;

  @ApiPropertyOptional({
    description: 'Filter by blocked status',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by customers with credit balance > 0',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasCredit?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by customers who have booked after this date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  hasBookingAfter?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'name',
    enum: ['name', 'phone', 'reputationScore', 'totalBookings', 'lastBookingDate', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
