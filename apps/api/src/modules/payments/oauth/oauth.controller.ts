// Mercado Pago OAuth Controller
// REST endpoints for OAuth authorization flow

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Delete,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { MercadoPagoOAuthService } from './oauth.service';
import {
  OAuthCallbackDto,
  OAuthStatusResponseDto,
  DisconnectOAuthResponseDto,
} from './oauth.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@sports-booking/database';

@ApiTags('Payments - OAuth')
@Controller('payments/oauth')
export class MercadoPagoOAuthController {
  constructor(
    private readonly oauthService: MercadoPagoOAuthService,
  ) {}

  /**
   * Initiate OAuth flow
   * Generates authorization URL and redirects user to Mercado Pago
   * GET /api/v1/payments/oauth/connect/:facilityId
   */
  @Get('connect/:facilityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate Mercado Pago OAuth flow',
    description:
      'Redirects to Mercado Pago authorization page. User must log in to their MP account and authorize access.',
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to Mercado Pago authorization page',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Facility not found',
  })
  async initiateOAuth(
    @Param('facilityId') facilityId: string,
    @Res() res: Response,
  ): Promise<void> {
    const authUrl =
      await this.oauthService.generateAuthorizationUrl(facilityId);

    // Redirect to Mercado Pago authorization page
    res.redirect(HttpStatus.FOUND, authUrl);
  }

  /**
   * OAuth callback endpoint
   * Receives authorization code from Mercado Pago and exchanges for tokens
   * GET /api/v1/payments/oauth/callback
   */
  @Get('callback')
  @ApiOperation({
    summary: 'OAuth callback endpoint',
    description:
      'Receives authorization code from Mercado Pago, exchanges for access token, and stores encrypted tokens.',
  })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code from Mercado Pago',
    required: true,
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter (facilityId:csrfToken)',
    required: true,
  })
  @ApiQuery({
    name: 'error',
    description: 'Error code if authorization failed',
    required: false,
  })
  @ApiQuery({
    name: 'error_description',
    description: 'Error description if authorization failed',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to frontend with success/error status',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid callback parameters',
  })
  async handleCallback(
    @Query() query: OAuthCallbackDto,
    @Res() res: Response,
  ): Promise<void> {
    // Check for error from Mercado Pago
    if (query.error) {
      const errorMessage = query.error_description || query.error;
      const redirectUrl = `${process.env.FRONTEND_URL}/integrations/mercadopago?error=${encodeURIComponent(errorMessage)}`;
      return res.redirect(HttpStatus.FOUND, redirectUrl);
    }

    try {
      // Exchange code for tokens
      const result = await this.oauthService.handleCallback(
        query.code,
        query.state,
      );

      // Redirect to frontend with success
      const redirectUrl = `${process.env.FRONTEND_URL}/integrations/mercadopago?success=true&facilityId=${result.facilityId}`;
      res.redirect(HttpStatus.FOUND, redirectUrl);
    } catch (error) {
      // Redirect to frontend with error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const redirectUrl = `${process.env.FRONTEND_URL}/integrations/mercadopago?error=${encodeURIComponent(errorMessage)}`;
      res.redirect(HttpStatus.FOUND, redirectUrl);
    }
  }

  /**
   * Get OAuth connection status
   * GET /api/v1/payments/oauth/status/:facilityId
   */
  @Get('status/:facilityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Mercado Pago OAuth connection status',
    description:
      'Returns whether facility is connected, token expiration, and connection details.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection status retrieved successfully',
    type: OAuthStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Facility not found',
  })
  async getStatus(
    @Param('facilityId') facilityId: string,
  ): Promise<OAuthStatusResponseDto> {
    return this.oauthService.getConnectionStatus(facilityId);
  }

  /**
   * Refresh OAuth token
   * POST /api/v1/payments/oauth/refresh/:facilityId
   */
  @Post('refresh/:facilityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh Mercado Pago OAuth token',
    description:
      'Manually refresh the OAuth access token using the refresh token.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Token refreshed successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Mercado Pago not connected or refresh failed',
  })
  async refreshToken(
    @Param('facilityId') facilityId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.oauthService.refreshToken(facilityId);
    return {
      success: true,
      message: 'Token refreshed successfully',
    };
  }

  /**
   * Disconnect OAuth
   * DELETE /api/v1/payments/oauth/disconnect/:facilityId
   */
  @Delete('disconnect/:facilityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disconnect Mercado Pago OAuth',
    description:
      'Removes OAuth tokens and disconnects Mercado Pago from facility.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Disconnected successfully',
    type: DisconnectOAuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Facility not found',
  })
  async disconnect(
    @Param('facilityId') facilityId: string,
  ): Promise<DisconnectOAuthResponseDto> {
    return this.oauthService.disconnect(facilityId);
  }
}
