// Join Opponent Match DTO
// Validation for joining an opponent match request

import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinOpponentMatchDto {
  @ApiPropertyOptional({ description: 'Notes from player joining' })
  @IsOptional()
  @IsString()
  notes?: string;
}
