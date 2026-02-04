// Block Customer DTO
// Validation for blocking/unblocking customers

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, MaxLength } from 'class-validator';

export class BlockCustomerDto {
  @ApiProperty({
    description: 'Whether to block the customer',
    example: true,
  })
  @IsBoolean()
  block: boolean;

  @ApiPropertyOptional({
    description: 'Reason for blocking (required when blocking)',
    example: 'Multiple no-shows without notice',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
