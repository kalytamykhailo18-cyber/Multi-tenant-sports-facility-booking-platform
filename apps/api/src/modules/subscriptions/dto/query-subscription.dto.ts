// Query Subscription DTO
// Validation for querying subscriptions with pagination and filters

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { SubscriptionStatus } from '@prisma/client';

export class QuerySubscriptionDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by subscription status',
    enum: SubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'nextPaymentDate',
    enum: ['createdAt', 'nextPaymentDate', 'status', 'priceAmount'],
    default: 'nextPaymentDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'nextPaymentDate' | 'status' | 'priceAmount' = 'nextPaymentDate';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
