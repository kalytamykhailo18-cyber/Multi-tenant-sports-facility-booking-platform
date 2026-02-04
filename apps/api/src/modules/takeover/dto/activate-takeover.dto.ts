import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class ActivateTakeoverDto {
  @ApiProperty({
    description: 'Customer phone number',
    example: '5491112345678',
  })
  @IsString()
  customerPhone: string;

  @ApiProperty({
    description: 'Silence duration in minutes',
    example: 30,
    default: 30,
    minimum: 15,
    maximum: 240,
  })
  @IsNumber()
  @IsOptional()
  @Min(15)
  @Max(240)
  silenceDurationMinutes?: number;

  @ApiProperty({
    description: 'Reason for takeover',
    example: 'Customer has complex question',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ExtendTakeoverDto {
  @ApiProperty({
    description: 'Customer phone number',
    example: '5491112345678',
  })
  @IsString()
  customerPhone: string;

  @ApiProperty({
    description: 'Additional minutes to extend',
    example: 30,
    minimum: 15,
    maximum: 120,
  })
  @IsNumber()
  @Min(15)
  @Max(120)
  additionalMinutes: number;
}

export class ResumeBotDto {
  @ApiProperty({
    description: 'Customer phone number',
    example: '5491112345678',
  })
  @IsString()
  customerPhone: string;
}
