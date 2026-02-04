// Mercado Pago OAuth Service
// Handles OAuth 2.0 authorization flow for Mercado Pago integration

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { encrypt, decrypt } from '@sports-booking/shared';
import axios from 'axios';
import {
  OAuthTokenResponseDto,
  OAuthStatusResponseDto,
  DisconnectOAuthResponseDto,
} from './oauth.dto';

@Injectable()
export class MercadoPagoOAuthService {
  private readonly logger = new Logger(MercadoPagoOAuthService.name);
  private readonly mpClientId: string;
  private readonly mpClientSecret: string;
  private readonly mpRedirectUri: string;
  private readonly encryptionKey: string;
  private readonly mpAuthUrl = 'https://auth.mercadopago.com.ar/authorization';
  private readonly mpTokenUrl = 'https://api.mercadopago.com/oauth/token';

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.mpClientId = this.config.get<string>('MP_CLIENT_ID') || '';
    this.mpClientSecret = this.config.get<string>('MP_CLIENT_SECRET') || '';
    this.mpRedirectUri = this.config.get<string>('MP_REDIRECT_URI') || '';
    this.encryptionKey = this.config.get<string>('ENCRYPTION_KEY') || '';

    if (!this.mpClientId || !this.mpClientSecret || !this.mpRedirectUri) {
      this.logger.warn(
        'Mercado Pago OAuth credentials not configured. OAuth flow will not work.',
      );
    }

    if (!this.encryptionKey) {
      throw new Error(
        'ENCRYPTION_KEY not configured. Required for OAuth token security.',
      );
    }
  }

  /**
   * Generate OAuth authorization URL for facility
   * @param facilityId - ID of facility to connect
   * @returns Authorization URL to redirect user to
   */
  async generateAuthorizationUrl(facilityId: string): Promise<string> {
    // Verify facility exists and user has access
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    // Generate CSRF token (state parameter)
    const csrfToken = this.generateCsrfToken();
    const state = `${facilityId}:${csrfToken}`;

    // Store CSRF token in Redis for verification (expires in 10 minutes)
    // TODO: Implement Redis storage in Task #9

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.mpClientId,
      response_type: 'code',
      platform_id: 'mp',
      redirect_uri: this.mpRedirectUri,
      state,
    });

    const authUrl = `${this.mpAuthUrl}?${params.toString()}`;

    this.logger.log(
      `Generated OAuth URL for facility ${facilityId}: ${authUrl}`,
    );

    return authUrl;
  }

  /**
   * Handle OAuth callback from Mercado Pago
   * Exchange authorization code for access token
   * @param code - Authorization code from MP
   * @param state - State parameter (facilityId:csrfToken)
   */
  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ facilityId: string; success: boolean }> {
    // Extract and verify facilityId from state
    const [facilityId, csrfToken] = state.split(':');

    if (!facilityId || !csrfToken) {
      throw new BadRequestException('Invalid state parameter');
    }

    // Verify CSRF token
    // TODO: Verify against Redis stored token in Task #9
    // For now, just check format

    // Verify facility exists
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    // Exchange code for access token
    try {
      const tokenResponse = await this.exchangeCodeForToken(code);

      // Encrypt tokens before storing
      const encryptedAccessToken = await encrypt(
        tokenResponse.access_token,
        this.encryptionKey,
      );
      const encryptedRefreshToken = await encrypt(
        tokenResponse.refresh_token,
        this.encryptionKey,
      );

      // Calculate token expiration
      const expiresAt = new Date(
        Date.now() + tokenResponse.expires_in * 1000,
      );

      // Store encrypted tokens in database
      await this.prisma.facility.update({
        where: { id: facilityId },
        data: {
          mpAccessToken: encryptedAccessToken,
          mpRefreshToken: encryptedRefreshToken,
          mpTokenExpiresAt: expiresAt,
          mpUserId: tokenResponse.user_id,
          mpConnected: true,
        },
      });

      this.logger.log(
        `Successfully connected Mercado Pago for facility ${facilityId}`,
      );

      return { facilityId, success: true };
    } catch (error) {
      this.logger.error(
        `OAuth callback failed for facility ${facilityId}:`,
        error,
      );
      throw new BadRequestException(
        'Failed to connect Mercado Pago. Please try again.',
      );
    }
  }

  /**
   * Exchange authorization code for access token
   * @param code - Authorization code from MP
   * @returns Token response from MP
   */
  private async exchangeCodeForToken(
    code: string,
  ): Promise<OAuthTokenResponseDto> {
    try {
      const response = await axios.post<OAuthTokenResponseDto>(
        this.mpTokenUrl,
        {
          grant_type: 'authorization_code',
          client_id: this.mpClientId,
          client_secret: this.mpClientSecret,
          code,
          redirect_uri: this.mpRedirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Token exchange failed:', error);
      throw new UnauthorizedException('Failed to obtain access token');
    }
  }

  /**
   * Refresh expired access token
   * @param facilityId - Facility ID to refresh token for
   * @returns New access token
   */
  async refreshToken(facilityId: string): Promise<string> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        mpRefreshToken: true,
        mpConnected: true,
      },
    });

    if (!facility?.mpConnected || !facility.mpRefreshToken) {
      throw new BadRequestException(
        'Mercado Pago is not connected for this facility',
      );
    }

    // Decrypt refresh token
    const refreshToken = await decrypt(
      facility.mpRefreshToken,
      this.encryptionKey,
    );

    try {
      const response = await axios.post<OAuthTokenResponseDto>(
        this.mpTokenUrl,
        {
          grant_type: 'refresh_token',
          client_id: this.mpClientId,
          client_secret: this.mpClientSecret,
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      // Encrypt new tokens
      const encryptedAccessToken = await encrypt(
        response.data.access_token,
        this.encryptionKey,
      );
      const encryptedRefreshToken = await encrypt(
        response.data.refresh_token,
        this.encryptionKey,
      );

      // Calculate new expiration
      const expiresAt = new Date(
        Date.now() + response.data.expires_in * 1000,
      );

      // Update database
      await this.prisma.facility.update({
        where: { id: facilityId },
        data: {
          mpAccessToken: encryptedAccessToken,
          mpRefreshToken: encryptedRefreshToken,
          mpTokenExpiresAt: expiresAt,
        },
      });

      this.logger.log(`Refreshed Mercado Pago token for facility ${facilityId}`);

      return response.data.access_token;
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  /**
   * Get OAuth connection status for facility
   * @param facilityId - Facility ID to check
   * @returns Connection status
   */
  async getConnectionStatus(
    facilityId: string,
  ): Promise<OAuthStatusResponseDto> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        mpConnected: true,
        mpTokenExpiresAt: true,
        mpUserId: true,
      },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    if (!facility.mpConnected) {
      return {
        connected: false,
        message: 'Mercado Pago is not connected',
      };
    }

    const now = new Date();
    const isExpired =
      facility.mpTokenExpiresAt && facility.mpTokenExpiresAt < now;

    if (isExpired) {
      return {
        connected: true,
        expiresAt: facility.mpTokenExpiresAt,
        userId: facility.mpUserId,
        message: 'Token expired - refresh required',
      };
    }

    return {
      connected: true,
      expiresAt: facility.mpTokenExpiresAt,
      userId: facility.mpUserId,
      message: 'Connected and active',
    };
  }

  /**
   * Disconnect Mercado Pago OAuth for facility
   * @param facilityId - Facility ID to disconnect
   */
  async disconnect(facilityId: string): Promise<DisconnectOAuthResponseDto> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    // Clear OAuth data
    await this.prisma.facility.update({
      where: { id: facilityId },
      data: {
        mpAccessToken: null,
        mpRefreshToken: null,
        mpTokenExpiresAt: null,
        mpUserId: null,
        mpConnected: false,
      },
    });

    this.logger.log(`Disconnected Mercado Pago for facility ${facilityId}`);

    return {
      success: true,
      message: 'Mercado Pago disconnected successfully',
    };
  }

  /**
   * Get decrypted access token for facility
   * Auto-refreshes if expired
   * @param facilityId - Facility ID
   * @returns Decrypted access token
   */
  async getAccessToken(facilityId: string): Promise<string> {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
      select: {
        mpAccessToken: true,
        mpConnected: true,
        mpTokenExpiresAt: true,
      },
    });

    if (!facility?.mpConnected || !facility.mpAccessToken) {
      throw new BadRequestException(
        'Mercado Pago is not connected for this facility. Please connect via OAuth.',
      );
    }

    // Check if token is expired
    const now = new Date();
    const isExpired =
      facility.mpTokenExpiresAt && facility.mpTokenExpiresAt < now;

    if (isExpired) {
      this.logger.log(`Token expired for facility ${facilityId}, refreshing...`);
      return this.refreshToken(facilityId);
    }

    // Decrypt and return token
    return decrypt(facility.mpAccessToken, this.encryptionKey);
  }

  /**
   * Generate CSRF token for state parameter
   * @returns Random token string
   */
  private generateCsrfToken(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
