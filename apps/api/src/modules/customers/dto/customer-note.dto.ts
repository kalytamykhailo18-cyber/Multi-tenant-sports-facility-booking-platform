// Customer Note DTO
// Validation for adding notes to customers

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class AddCustomerNoteDto {
  @ApiProperty({
    description: 'Note content',
    example: 'Customer called to reschedule their booking for next week',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
