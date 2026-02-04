// Add Credit DTO
// Validation for adding credit to customer account

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsString, IsOptional, MaxLength } from 'class-validator';

export class AddCreditDto {
  @ApiProperty({
    description: 'Credit amount to add (in facility currency)',
    example: 5000,
    minimum: 0.01,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description: 'Reason for adding credit',
    example: 'Compensation for service issue',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
