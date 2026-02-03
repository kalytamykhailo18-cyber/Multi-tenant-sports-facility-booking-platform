// Update Court DTO
// Validation for updating an existing court

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourtStatus, SportType } from '@prisma/client';

export class UpdateCourtDto {
  @ApiPropertyOptional({
    description: 'Court name',
    example: 'Cancha 1',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Sport type',
    enum: SportType,
  })
  @IsOptional()
  @IsEnum(SportType)
  sportType?: SportType;

  @ApiPropertyOptional({
    description: 'Description of the court',
    example: 'Synthetic grass, covered, with lighting',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Surface type',
    example: 'synthetic',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  surfaceType?: string;

  @ApiPropertyOptional({
    description: 'Whether the court is indoor',
  })
  @IsOptional()
  @IsBoolean()
  isIndoor?: boolean;

  @ApiPropertyOptional({
    description: 'Base price per hour in facility currency',
    example: 15000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  basePricePerHour?: number;

  @ApiPropertyOptional({
    description: 'Court status',
    enum: CourtStatus,
  })
  @IsOptional()
  @IsEnum(CourtStatus)
  status?: CourtStatus;

  @ApiPropertyOptional({
    description: 'Display order for sorting',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateCourtStatusDto {
  @ApiPropertyOptional({
    description: 'New court status',
    enum: CourtStatus,
  })
  @IsEnum(CourtStatus)
  status: CourtStatus;
}

export class ReorderCourtsDto {
  @ApiPropertyOptional({
    description: 'Facility ID',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  facilityId: string;

  @ApiPropertyOptional({
    description: 'Array of court IDs in desired order',
    example: ['court1', 'court2', 'court3'],
  })
  @IsString({ each: true })
  courtIds: string[];
}
