// Main WebSocket Gateway
// Handles connections, tenant room management, and event broadcasting

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtPayload, SOCKET_EVENTS } from '@sports-booking/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedSocket, WsJwtGuard } from './ws-jwt.guard';

// Connected client info
interface ConnectedClient {
  socketId: string;
  userId: string;
  email: string;
  role: string;
  tenantId: string | null;
  connectedAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Allow all origins in development, restrict in production
      callback(null, true);
    },
    credentials: true,
  },
  // Namespace: root namespace
  transports: ['websocket', 'polling'],
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WsGateway.name);

  // Track connected clients by socket ID
  private connectedClients: Map<string, ConnectedClient> = new Map();

  // Track clients by tenant ID for easy lookup
  private tenantClients: Map<string, Set<string>> = new Map();

  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Called after gateway is initialized
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handles new client connections
   * Authenticates the client and joins them to their tenant room
   */
  async handleConnection(client: Socket) {
    try {
      // Extract and verify JWT token
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted connection without token`);
        client.emit(SOCKET_EVENTS.ERROR, { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const jwtSecret = this.configService.get<string>('jwt.secret');
      if (!jwtSecret) {
        this.logger.error('JWT secret not configured');
        client.emit(SOCKET_EVENTS.ERROR, { message: 'Server configuration error' });
        client.disconnect();
        return;
      }

      let payload: JwtPayload;
      try {
        payload = this.jwtService.verify<JwtPayload>(token, { secret: jwtSecret });
      } catch (err) {
        this.logger.warn(`Client ${client.id} provided invalid token`);
        client.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      // Verify user exists and is active
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

      if (!user || !user.isActive) {
        this.logger.warn(`Client ${client.id} user not found or inactive`);
        client.emit(SOCKET_EVENTS.ERROR, { message: 'User not found or inactive' });
        client.disconnect();
        return;
      }

      // Attach user data to socket
      (client as AuthenticatedSocket).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };

      // Register client
      const clientInfo: ConnectedClient = {
        socketId: client.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        connectedAt: new Date(),
      };
      this.connectedClients.set(client.id, clientInfo);

      // Join tenant room if user has a tenantId
      if (user.tenantId) {
        await this.joinTenantRoom(client, user.tenantId);
      }

      this.logger.log(
        `Client connected: ${client.id} (User: ${user.email}, Tenant: ${user.tenantId || 'N/A'})`
      );

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error}`);
      client.emit(SOCKET_EVENTS.ERROR, { message: 'Connection error' });
      client.disconnect();
    }
  }

  /**
   * Handles client disconnection
   */
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);

    if (clientInfo) {
      // Remove from tenant tracking
      if (clientInfo.tenantId) {
        this.leaveTenantRoom(client, clientInfo.tenantId);
      }

      // Remove from connected clients
      this.connectedClients.delete(client.id);

      this.logger.log(
        `Client disconnected: ${client.id} (User: ${clientInfo.email})`
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id} (unregistered)`);
    }
  }

  // ==========================================
  // Tenant Room Management
  // ==========================================

  /**
   * Joins a client to their tenant room
   */
  private async joinTenantRoom(client: Socket, tenantId: string): Promise<void> {
    const roomName = this.getTenantRoomName(tenantId);

    await client.join(roomName);

    // Track client in tenant
    if (!this.tenantClients.has(tenantId)) {
      this.tenantClients.set(tenantId, new Set());
    }
    this.tenantClients.get(tenantId)!.add(client.id);

    this.logger.debug(`Client ${client.id} joined tenant room: ${roomName}`);
  }

  /**
   * Removes a client from their tenant room
   */
  private leaveTenantRoom(client: Socket, tenantId: string): void {
    const roomName = this.getTenantRoomName(tenantId);

    client.leave(roomName);

    // Remove from tracking
    const tenantClientSet = this.tenantClients.get(tenantId);
    if (tenantClientSet) {
      tenantClientSet.delete(client.id);
      if (tenantClientSet.size === 0) {
        this.tenantClients.delete(tenantId);
      }
    }

    this.logger.debug(`Client ${client.id} left tenant room: ${roomName}`);
  }

  /**
   * Generates room name for a tenant
   */
  private getTenantRoomName(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  // ==========================================
  // Event Emission Methods (for use by services)
  // ==========================================

  /**
   * Emits an event to all clients in a specific tenant room
   * IMPORTANT: Use this method to emit events, never emit globally!
   */
  emitToTenant<T>(tenantId: string, event: string, data: T): void {
    const roomName = this.getTenantRoomName(tenantId);
    this.server.to(roomName).emit(event, data);
    this.logger.debug(`Emitted ${event} to tenant ${tenantId}`);
  }

  /**
   * Emits an event to a specific user (all their connected sessions)
   */
  emitToUser<T>(userId: string, event: string, data: T): void {
    // Find all sockets for this user
    for (const [socketId, client] of this.connectedClients) {
      if (client.userId === userId) {
        this.server.to(socketId).emit(event, data);
      }
    }
    this.logger.debug(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Emits an event to all clients except the requester
   * Use when the requester already has the data from HTTP response
   */
  emitToTenantExcept<T>(
    tenantId: string,
    excludeSocketId: string,
    event: string,
    data: T,
  ): void {
    const roomName = this.getTenantRoomName(tenantId);
    this.server.to(roomName).except(excludeSocketId).emit(event, data);
    this.logger.debug(`Emitted ${event} to tenant ${tenantId} except ${excludeSocketId}`);
  }

  // ==========================================
  // Client Message Handlers
  // ==========================================

  /**
   * Handles explicit room join requests (if needed)
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SOCKET_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    client: AuthenticatedSocket,
    payload: { tenantId: string },
  ): Promise<{ success: boolean; message: string }> {
    // Verify user has access to this tenant
    if (client.user.tenantId !== payload.tenantId && client.user.role !== 'SUPER_ADMIN') {
      throw new WsException('Access denied to this tenant room');
    }

    await this.joinTenantRoom(client, payload.tenantId);

    return { success: true, message: `Joined tenant room: ${payload.tenantId}` };
  }

  /**
   * Handles explicit room leave requests
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SOCKET_EVENTS.LEAVE_ROOM)
  handleLeaveRoom(
    client: AuthenticatedSocket,
    payload: { tenantId: string },
  ): { success: boolean; message: string } {
    this.leaveTenantRoom(client, payload.tenantId);
    return { success: true, message: `Left tenant room: ${payload.tenantId}` };
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  /**
   * Gets count of connected clients for a tenant
   */
  getTenantClientCount(tenantId: string): number {
    return this.tenantClients.get(tenantId)?.size || 0;
  }

  /**
   * Gets total count of connected clients
   */
  getTotalClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Checks if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    for (const client of this.connectedClients.values()) {
      if (client.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extracts JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    // Try query params first (recommended for Socket.io)
    const queryToken = client.handshake.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }

    // Try Authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && typeof authHeader === 'string') {
      const [type, token] = authHeader.split(' ');
      if (type?.toLowerCase() === 'bearer' && token) {
        return token;
      }
    }

    // Try auth object (Socket.io v4+)
    const authToken = client.handshake.auth?.token;
    if (authToken && typeof authToken === 'string') {
      return authToken;
    }

    return null;
  }
}
