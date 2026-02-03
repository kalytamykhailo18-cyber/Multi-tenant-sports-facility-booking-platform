// Query Court DTO
// Validation for querying courts with filters

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourtStatus, SportType } from '@prisma/client';

export class QueryCourtDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by facility ID',
    example: 'clx1234567890facility',
  })
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by court status',
    enum: CourtStatus,
  })
  @IsOptional()
  @IsEnum(CourtStatus)
  status?: CourtStatus;

  @ApiPropertyOptional({
    description: 'Filter by sport type',
    enum: SportType,
  })
  @IsOptional()
  @IsEnum(SportType)
  sportType?: SportType;

  @ApiPropertyOptional({
    description: 'Filter indoor/outdoor',
  })
  @IsOptional()
  @Type(() => Boolean)
  isIndoor?: boolean;

  @ApiPropertyOptional({
    description: 'Search term for name or description',
    example: 'Cancha',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'displayOrder',
    enum: ['name', 'basePricePerHour', 'createdAt', 'displayOrder', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'basePricePerHour' | 'createdAt' | 'displayOrder' | 'status';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
