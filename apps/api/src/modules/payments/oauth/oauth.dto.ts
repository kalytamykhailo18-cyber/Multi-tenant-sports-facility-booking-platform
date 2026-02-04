// Mercado Pago OAuth DTOs
// Handles OAuth authorization flow for Mercado Pago integration

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

/**
 * DTO for initiating OAuth authorization
 * Generates authorization URL for facility to connect their MP account
 */
export class InitiateOAuthDto {
  @ApiProperty({
    description: 'Facility ID to connect',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @ApiPropertyOptional({
    description: 'Optional redirect URL after OAuth completion',
    example: 'https://app.sportsbook.com/facilities/settings',
  })
  @IsUrl()
  @IsOptional()
  redirectUrl?: string;
}

/**
 * DTO for OAuth callback query parameters
 * Received from Mercado Pago after user authorizes
 */
export class OAuthCallbackDto {
  @ApiProperty({
    description: 'Authorization code from Mercado Pago',
    example: 'TG-65f8a1b2c3d4e5f6g7h8i9j0',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection (contains facilityId)',
    example: 'clx1234567890:randomToken',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({
    description: 'Error code if authorization failed',
    example: 'access_denied',
  })
  @IsString()
  @IsOptional()
  error?: string;

  @ApiPropertyOptional({
    description: 'Error description if authorization failed',
  })
  @IsString()
  @IsOptional()
  error_description?: string;
}

/**
 * DTO for OAuth token exchange request
 * Sent to Mercado Pago to exchange code for access token
 */
export class TokenExchangeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  client_secret: string;

  @IsString()
  @IsNotEmpty()
  grant_type: 'authorization_code';

  @IsUrl()
  @IsNotEmpty()
  redirect_uri: string;
}

/**
 * DTO for OAuth token refresh request
 * Used to refresh expired access tokens
 */
export class TokenRefreshDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  client_secret: string;

  @IsString()
  @IsNotEmpty()
  grant_type: 'refresh_token';
}

/**
 * Response DTO for OAuth token
 * Returned from Mercado Pago token endpoint
 */
export class OAuthTokenResponseDto {
  @ApiProperty({
    description: 'Access token for API requests',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type (always "Bearer")',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 15552000,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Refresh token for renewing access',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Scope of permissions granted',
    example: 'read write',
  })
  scope: string;

  @ApiProperty({
    description: 'Mercado Pago user ID',
    example: '653243368',
  })
  user_id: string;

  @ApiPropertyOptional({
    description: 'Public key for client-side operations',
  })
  public_key?: string;

  @ApiPropertyOptional({
    description: 'Live mode indicator',
  })
  live_mode?: boolean;
}

/**
 * Response DTO for OAuth status
 * Returns connection status for a facility
 */
export class OAuthStatusResponseDto {
  @ApiProperty({
    description: 'Whether Mercado Pago is connected',
    example: true,
  })
  connected: boolean;

  @ApiPropertyOptional({
    description: 'Token expiration date',
    example: '2026-08-03T12:00:00.000Z',
    nullable: true,
  })
  expiresAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Mercado Pago user ID',
    example: '653243368',
    nullable: true,
  })
  userId?: string | null;

  @ApiProperty({
    description: 'Status message',
    example: 'Connected and active',
  })
  message: string;
}

/**
 * Response DTO for disconnecting OAuth
 */
export class DisconnectOAuthResponseDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Status message',
    example: 'Mercado Pago disconnected successfully',
  })
  message: string;
}
