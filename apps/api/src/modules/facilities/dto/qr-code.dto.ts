// QR Code DTOs
// DTOs for QR code generation

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QrCodeResponseDto {
  @ApiProperty({
    description: 'QR code as base64 encoded PNG image',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCode: string;

  @ApiProperty({
    description: 'WhatsApp deep link URL',
    example: 'https://wa.me/5491112345678?text=Hola%2C%20quiero%20reservar',
  })
  whatsappLink: string;

  @ApiProperty({
    description: 'Facility name for display',
    example: 'Cancha Los Amigos',
  })
  facilityName: string;

  @ApiPropertyOptional({
    description: 'WhatsApp phone number',
    example: '+54 11 1234-5678',
  })
  whatsappPhone?: string;
}

export class GenerateQrCodeDto {
  @ApiPropertyOptional({
    description: 'Custom greeting message to include in the QR link',
    example: 'Hola, quiero reservar una cancha',
    default: 'Hola, quiero hacer una reserva',
  })
  message?: string;

  @ApiPropertyOptional({
    description: 'QR code size in pixels',
    example: 300,
    default: 300,
    minimum: 100,
    maximum: 1000,
  })
  size?: number;
}
