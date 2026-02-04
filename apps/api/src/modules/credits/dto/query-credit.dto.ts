// Query Credit DTO
// Query parameters for listing and filtering credits

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreditReason } from '@prisma/client';

export class QueryCreditDto {
  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 'clx1234567890customer',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by credit reason',
    enum: CreditReason,
    example: CreditReason.EARLY_CANCELLATION,
  })
  @IsOptional()
  @IsEnum(CreditReason)
  reason?: CreditReason;

  @ApiPropertyOptional({
    description: 'Filter by source booking ID',
    example: 'clx1234567890booking',
  })
  @IsOptional()
  @IsString()
  sourceBookingId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active credits only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by credits with remaining balance',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasBalance?: boolean;

  @ApiPropertyOptional({
    description: 'Include expired credits',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeExpired?: boolean;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['createdAt', 'remainingAmount', 'expiresAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'remainingAmount' | 'expiresAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
