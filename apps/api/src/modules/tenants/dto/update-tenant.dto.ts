// Update Tenant DTO
// Validation for updating a tenant

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsEnum,
} from 'class-validator';
import { TenantStatus } from '@prisma/client';

export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'Business name of the tenant',
    example: 'Canchas Los Amigos',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug',
    example: 'canchas-los-amigos',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, alphanumeric with hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Status of the tenant',
    enum: TenantStatus,
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
