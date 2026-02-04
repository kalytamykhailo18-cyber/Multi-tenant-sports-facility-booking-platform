// Opponent Match Query DTOs
// Query parameters for filtering opponent matches

import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetOpponentMatchesQueryDto {
  @ApiPropertyOptional({ description: 'Facility ID' })
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiPropertyOptional({ description: 'Date filter', example: '2026-02-10' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Sport type filter', enum: ['SOCCER', 'PADEL', 'TENNIS', 'MULTI'] })
  @IsOptional()
  @IsEnum(['SOCCER', 'PADEL', 'TENNIS', 'MULTI'])
  sportType?: string;

  @ApiPropertyOptional({ description: 'Skill level filter', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ANY'] })
  @IsOptional()
  @IsEnum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ANY'])
  skillLevel?: string;

  @ApiPropertyOptional({ description: 'Status filter', enum: ['OPEN', 'MATCHED', 'EXPIRED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['OPEN', 'MATCHED', 'EXPIRED', 'CANCELLED'])
  status?: string;
}
