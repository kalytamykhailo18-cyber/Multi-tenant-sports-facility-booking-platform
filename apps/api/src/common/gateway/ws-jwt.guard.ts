// WebSocket JWT Authentication Guard
// Validates JWT tokens on WebSocket connections

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '@sports-booking/shared';
import { PrismaService } from '../../prisma';

// Interface for authenticated socket
export interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string | null;
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient<Socket>();
      const token = this.extractToken(client);

      if (!token) {
        throw new WsException('Authentication token not provided');
      }

      const jwtSecret = this.configService.get<string>('jwt.secret');
      if (!jwtSecret) {
        throw new WsException('JWT configuration error');
      }

      // Verify token
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: jwtSecret,
      });

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          tenantId: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new WsException('User not found');
      }

      if (!user.isActive) {
        throw new WsException('User account is deactivated');
      }

      // Attach user to socket for later use
      (client as AuthenticatedSocket).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      this.logger.error(`WebSocket authentication failed: ${error}`);
      throw new WsException('Invalid authentication token');
    }
  }

  /**
   * Extracts JWT token from socket handshake
   * Supports both query parameter and Authorization header
   */
  private extractToken(client: Socket): string | null {
    // Try to get token from query params first (recommended for Socket.io)
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // Try to get token from Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type?.toLowerCase() === 'bearer' && token) {
        return token;
      }
    }

    // Try to get token from auth object (Socket.io v4+)
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }

    return null;
  }
}
