// Create Customer DTO
// Validation for creating a new customer

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer name',
    example: 'Juan Pérez',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'WhatsApp phone number (unique per tenant)',
    example: '+54 11 1234-5678',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[\d\s\-+()]+$/, {
    message: 'Phone must contain only digits, spaces, hyphens, plus signs, and parentheses',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Customer email address',
    example: 'juan@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Internal notes about the customer',
    example: 'Prefers evening slots',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
