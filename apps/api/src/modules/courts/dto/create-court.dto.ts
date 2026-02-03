// Create Court DTO
// Validation for creating a new court

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourtStatus, SportType } from '@prisma/client';

export class CreateCourtDto {
  @ApiProperty({
    description: 'Facility ID this court belongs to',
    example: 'clx1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiProperty({
    description: 'Court name',
    example: 'Cancha 1',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Sport type',
    enum: SportType,
    default: SportType.SOCCER,
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
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isIndoor?: boolean;

  @ApiProperty({
    description: 'Base price per hour in facility currency',
    example: 15000,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  basePricePerHour: number;

  @ApiPropertyOptional({
    description: 'Court status',
    enum: CourtStatus,
    default: CourtStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CourtStatus)
  status?: CourtStatus;

  @ApiPropertyOptional({
    description: 'Display order for sorting',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
