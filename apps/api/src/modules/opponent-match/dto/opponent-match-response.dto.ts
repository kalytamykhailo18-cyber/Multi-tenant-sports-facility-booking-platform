// Opponent Match Response DTOs
// Response formats for opponent match endpoints

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlayerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  joinedAt: Date;
}

export class OpponentMatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  facilityId: string;

  @ApiProperty()
  facilityName: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  customerPhone: string;

  @ApiProperty({ description: 'Requested date', example: '2026-02-10' })
  requestedDate: string;

  @ApiProperty({ description: 'Requested time', example: '20:00' })
  requestedTime: string;

  @ApiPropertyOptional()
  courtId?: string;

  @ApiPropertyOptional()
  courtName?: string;

  @ApiProperty({ enum: ['SOCCER', 'PADEL', 'TENNIS', 'MULTI'] })
  sportType: string;

  @ApiProperty({ description: 'Number of players needed' })
  playersNeeded: number;

  @ApiProperty({ description: 'Current number of players (including creator)' })
  currentPlayers: number;

  @ApiProperty({ description: 'Number of open spots remaining' })
  spotsRemaining: number;

  @ApiProperty({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ANY'] })
  skillLevel: string;

  @ApiProperty({ enum: ['OPEN', 'MATCHED', 'EXPIRED', 'CANCELLED'] })
  status: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiPropertyOptional()
  bookingId?: string;

  @ApiProperty({ type: [PlayerResponseDto] })
  joinedPlayers: PlayerResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OpponentMatchListResponseDto {
  @ApiProperty({ type: [OpponentMatchResponseDto] })
  matches: OpponentMatchResponseDto[];

  @ApiProperty()
  total: number;
}
