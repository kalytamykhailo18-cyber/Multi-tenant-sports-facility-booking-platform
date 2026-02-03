// Register DTO
// Validates user registration data

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address (used for login)',
    example: 'newuser@facility.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (min 8 chars, must contain at least one number)',
    example: 'SecurePass123',
    minLength: 8,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'Juan Perez',
    maxLength: 100,
  })
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+54911234567890',
  })
  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  phone?: string;
}
