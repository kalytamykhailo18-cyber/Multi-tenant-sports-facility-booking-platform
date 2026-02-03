// Update Credentials DTO
// Validation for updating facility credentials

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

// WhatsApp credentials (Meta Cloud API)
export class UpdateWhatsAppCredentialsDto {
  @ApiProperty({
    description: 'Meta API Key (Business Account ID)',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({
    description: 'Meta API Secret (Access Token)',
    example: 'EAAxxxxxx...',
  })
  @IsString()
  @IsNotEmpty()
  apiSecret: string;

  @ApiPropertyOptional({
    description: 'Webhook verification token',
    example: 'my_secure_token',
  })
  @IsOptional()
  @IsString()
  webhookToken?: string;
}

// Mercado Pago credentials
export class UpdateMercadoPagoCredentialsDto {
  @ApiProperty({
    description: 'Mercado Pago Access Token',
    example: 'APP_USR-xxxxx-yyyyy-zzzzz',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    description: 'Mercado Pago Public Key',
    example: 'APP_USR-aaaaa-bbbbb-ccccc',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;
}

// AI credentials (Gemini)
export class UpdateGeminiCredentialsDto {
  @ApiProperty({
    description: 'Google Gemini API Key',
    example: 'AIzaSy...',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}

// Speech-to-text credentials (Whisper/OpenAI)
export class UpdateWhisperCredentialsDto {
  @ApiProperty({
    description: 'OpenAI API Key for Whisper',
    example: 'sk-...',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}

// Credential types enum for the endpoint parameter
export type CredentialType = 'whatsapp' | 'mercadopago' | 'gemini' | 'whisper';

// Test credentials result
export class TestCredentialsResultDto {
  @ApiProperty({ description: 'Whether the test was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Result message', example: 'Connection successful' })
  message: string;

  @ApiPropertyOptional({ description: 'Additional details if any' })
  details?: Record<string, unknown>;
}
