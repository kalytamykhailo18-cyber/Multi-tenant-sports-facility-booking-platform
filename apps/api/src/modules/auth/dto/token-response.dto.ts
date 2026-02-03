// Token Response DTO
// Defines the structure of authentication response

import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@sports-booking/database';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: 'clp1234567890' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@facility.com' })
  email: string;

  @ApiProperty({ description: 'User full name', example: 'Juan Perez' })
  fullName: string;

  @ApiProperty({ description: 'User phone', example: '+54911234567890', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'User role', enum: ['SUPER_ADMIN', 'OWNER', 'STAFF'] })
  role: UserRole;

  @ApiProperty({ description: 'Tenant ID (null for Super Admin)', nullable: true })
  tenantId: string | null;

  @ApiProperty({ description: 'Whether user is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 604800,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'User data (without password)',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 604800,
  })
  expiresIn: number;
}
