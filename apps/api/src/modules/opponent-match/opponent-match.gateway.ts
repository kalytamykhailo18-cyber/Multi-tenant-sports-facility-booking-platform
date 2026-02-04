// Opponent Match Gateway
// WebSocket events for real-time opponent match updates

import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { OpponentMatchResponseDto } from './dto/opponent-match-response.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class OpponentMatchGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Emit when a new opponent match is created
   */
  emitMatchCreated(tenantId: string, match: OpponentMatchResponseDto): void {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('opponent-match:created', match);
  }

  /**
   * Emit when a player joins a match
   */
  emitPlayerJoined(tenantId: string, match: OpponentMatchResponseDto): void {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('opponent-match:player-joined', match);
  }

  /**
   * Emit when a player leaves a match
   */
  emitPlayerLeft(tenantId: string, match: OpponentMatchResponseDto): void {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('opponent-match:player-left', match);
  }

  /**
   * Emit when a match is cancelled
   */
  emitMatchCancelled(tenantId: string, match: OpponentMatchResponseDto): void {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('opponent-match:cancelled', match);
  }

  /**
   * Emit when a match becomes fully matched
   */
  emitMatchCompleted(tenantId: string, match: OpponentMatchResponseDto): void {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('opponent-match:completed', match);
  }
}
