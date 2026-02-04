// Create Opponent Match DTO
// Validation for creating a new opponent match request

import { IsString, IsInt, Min, Max, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOpponentMatchDto {
  @ApiProperty({ description: 'Facility ID' })
  @IsString()
  facilityId: string;

  @ApiProperty({ description: 'Requested date', example: '2026-02-10' })
  @IsDateString()
  requestedDate: string;

  @ApiProperty({ description: 'Requested time', example: '20:00' })
  @IsString()
  requestedTime: string;

  @ApiPropertyOptional({ description: 'Court ID (optional preference)' })
  @IsOptional()
  @IsString()
  courtId?: string;

  @ApiProperty({ description: 'Sport type', enum: ['SOCCER', 'PADEL', 'TENNIS', 'MULTI'] })
  @IsEnum(['SOCCER', 'PADEL', 'TENNIS', 'MULTI'])
  sportType: string;

  @ApiProperty({ description: 'Number of players needed', minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  playersNeeded: number;

  @ApiPropertyOptional({ description: 'Skill level filter', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ANY'] })
  @IsOptional()
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ANY'])
  skillLevel?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
