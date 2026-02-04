// Update Reputation DTO
// Validation for manually adjusting customer reputation

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, Min, Max, IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateReputationDto {
  @ApiProperty({
    description: 'New reputation score (0-200)',
    example: 80,
    minimum: 0,
    maximum: 200,
  })
  @IsInt()
  @Min(0)
  @Max(200)
  score: number;

  @ApiPropertyOptional({
    description: 'Reason for manual adjustment',
    example: 'Score reset after resolution of complaint',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
