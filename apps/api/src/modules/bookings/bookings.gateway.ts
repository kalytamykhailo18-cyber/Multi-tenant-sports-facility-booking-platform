// Bookings WebSocket Gateway
// Handles booking-specific WebSocket events and subscriptions

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard, AuthenticatedSocket } from '../../common/gateway/ws-jwt.guard';

// Booking socket event names
export const BOOKING_EVENTS = {
  // Client -> Server subscriptions
  SUBSCRIBE_FACILITY: 'booking:subscribe_facility',
  UNSUBSCRIBE_FACILITY: 'booking:unsubscribe_facility',
  SUBSCRIBE_DATE: 'booking:subscribe_date',
  UNSUBSCRIBE_DATE: 'booking:unsubscribe_date',

  // Server -> Client events (emitted by services via WsGateway)
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CANCELLED: 'booking:cancelled',
  BOOKING_STATUS_CHANGED: 'booking:status_changed',
  SLOT_LOCKED: 'slot:locked',
  SLOT_UNLOCKED: 'slot:unlocked',
} as const;

// Interface for facility subscription payload
interface FacilitySubscriptionPayload {
  facilityId: string;
}

// Interface for date subscription payload
interface DateSubscriptionPayload {
  facilityId: string;
  date: string; // YYYY-MM-DD format
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BookingsGateway {
  private readonly logger = new Logger(BookingsGateway.name);

  @WebSocketServer()
  server: Server;

  // Track client subscriptions
  private facilitySubscriptions: Map<string, Set<string>> = new Map(); // socketId -> Set<facilityId>
  private dateSubscriptions: Map<string, Set<string>> = new Map(); // socketId -> Set<facilityId:date>

  /**
   * Subscribe to a facility's booking events
   * Client will receive all booking updates for this facility
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(BOOKING_EVENTS.SUBSCRIBE_FACILITY)
  handleSubscribeFacility(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: FacilitySubscriptionPayload,
  ): { success: boolean; message: string } {
    const { facilityId } = payload;

    // Verify user has access to the tenant that owns this facility
    // (This is already enforced by tenant room membership in main gateway,
    // but we track subscriptions for fine-grained updates)

    // Track subscription
    if (!this.facilitySubscriptions.has(client.id)) {
      this.facilitySubscriptions.set(client.id, new Set());
    }
    this.facilitySubscriptions.get(client.id)!.add(facilityId);

    // Join facility-specific room for targeted events
    const roomName = `facility:${facilityId}`;
    client.join(roomName);

    this.logger.debug(`Client ${client.id} subscribed to facility ${facilityId}`);

    return {
      success: true,
      message: `Subscribed to facility ${facilityId}`,
    };
  }

  /**
   * Unsubscribe from a facility's booking events
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(BOOKING_EVENTS.UNSUBSCRIBE_FACILITY)
  handleUnsubscribeFacility(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: FacilitySubscriptionPayload,
  ): { success: boolean; message: string } {
    const { facilityId } = payload;

    // Remove subscription tracking
    const subscriptions = this.facilitySubscriptions.get(client.id);
    if (subscriptions) {
      subscriptions.delete(facilityId);
      if (subscriptions.size === 0) {
        this.facilitySubscriptions.delete(client.id);
      }
    }

    // Leave facility-specific room
    const roomName = `facility:${facilityId}`;
    client.leave(roomName);

    this.logger.debug(`Client ${client.id} unsubscribed from facility ${facilityId}`);

    return {
      success: true,
      message: `Unsubscribed from facility ${facilityId}`,
    };
  }

  /**
   * Subscribe to a specific date's booking events for a facility
   * Useful for calendar day views to get targeted updates
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(BOOKING_EVENTS.SUBSCRIBE_DATE)
  handleSubscribeDate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: DateSubscriptionPayload,
  ): { success: boolean; message: string } {
    const { facilityId, date } = payload;

    // Track subscription
    if (!this.dateSubscriptions.has(client.id)) {
      this.dateSubscriptions.set(client.id, new Set());
    }
    const key = `${facilityId}:${date}`;
    this.dateSubscriptions.get(client.id)!.add(key);

    // Join date-specific room for targeted events
    const roomName = `calendar:${facilityId}:${date}`;
    client.join(roomName);

    this.logger.debug(`Client ${client.id} subscribed to date ${date} for facility ${facilityId}`);

    return {
      success: true,
      message: `Subscribed to date ${date} for facility ${facilityId}`,
    };
  }

  /**
   * Unsubscribe from a specific date's booking events
   */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(BOOKING_EVENTS.UNSUBSCRIBE_DATE)
  handleUnsubscribeDate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: DateSubscriptionPayload,
  ): { success: boolean; message: string } {
    const { facilityId, date } = payload;

    // Remove subscription tracking
    const subscriptions = this.dateSubscriptions.get(client.id);
    const key = `${facilityId}:${date}`;
    if (subscriptions) {
      subscriptions.delete(key);
      if (subscriptions.size === 0) {
        this.dateSubscriptions.delete(client.id);
      }
    }

    // Leave date-specific room
    const roomName = `calendar:${facilityId}:${date}`;
    client.leave(roomName);

    this.logger.debug(`Client ${client.id} unsubscribed from date ${date} for facility ${facilityId}`);

    return {
      success: true,
      message: `Unsubscribed from date ${date} for facility ${facilityId}`,
    };
  }

  /**
   * Clean up subscriptions when client disconnects
   */
  handleDisconnect(client: Socket): void {
    // Clean up facility subscriptions
    this.facilitySubscriptions.delete(client.id);

    // Clean up date subscriptions
    this.dateSubscriptions.delete(client.id);

    this.logger.debug(`Cleaned up booking subscriptions for client ${client.id}`);
  }

  // ==========================================
  // Utility Methods for Services
  // ==========================================

  /**
   * Emit to all clients subscribed to a specific facility
   */
  emitToFacility<T>(facilityId: string, event: string, data: T): void {
    const roomName = `facility:${facilityId}`;
    this.server.to(roomName).emit(event, data);
    this.logger.debug(`Emitted ${event} to facility ${facilityId}`);
  }

  /**
   * Emit to all clients subscribed to a specific date for a facility
   */
  emitToDate<T>(facilityId: string, date: string, event: string, data: T): void {
    const roomName = `calendar:${facilityId}:${date}`;
    this.server.to(roomName).emit(event, data);
    this.logger.debug(`Emitted ${event} to ${facilityId}/${date}`);
  }

  /**
   * Gets count of clients subscribed to a facility
   */
  getFacilitySubscriberCount(facilityId: string): number {
    let count = 0;
    for (const subscriptions of this.facilitySubscriptions.values()) {
      if (subscriptions.has(facilityId)) {
        count++;
      }
    }
    return count;
  }
}
