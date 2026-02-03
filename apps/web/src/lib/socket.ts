// Socket.io Client Singleton
// Single socket connection for the entire application
// Connects once on login, disconnects on logout, auto-reconnects

import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sports-booking/shared';

// Socket server URL from environment
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// Token storage key (must match api.ts)
const TOKEN_KEY = 'auth_token';

// Socket connection state
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Event callback type
type EventCallback<T = unknown> = (data: T) => void;

// Singleton socket instance
let socket: Socket | null = null;
let connectionState: ConnectionState = 'disconnected';

// Event listeners tracking for cleanup
const eventListeners: Map<string, Set<EventCallback>> = new Map();

// State change listeners
const stateListeners: Set<(state: ConnectionState) => void> = new Set();

/**
 * Gets the stored auth token
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Sets the connection state and notifies listeners
 */
function setConnectionState(state: ConnectionState): void {
  connectionState = state;
  stateListeners.forEach((listener) => listener(state));
}

/**
 * Creates and configures the socket connection
 */
function createSocket(token: string): Socket {
  const newSocket = io(SOCKET_URL, {
    // Pass token in auth object (Socket.io v4+ recommended)
    auth: {
      token,
    },
    // Also pass as query param for backwards compatibility
    query: {
      token,
    },
    // Connection options
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
  });

  // Connection event handlers
  newSocket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log('[Socket] Connected to server');
    setConnectionState('connected');
  });

  newSocket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    console.log(`[Socket] Disconnected: ${reason}`);
    setConnectionState('disconnected');
  });

  newSocket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    setConnectionState('error');
  });

  newSocket.on(SOCKET_EVENTS.ERROR, (error) => {
    console.error('[Socket] Server error:', error);
    setConnectionState('error');
  });

  // Reconnection handlers
  newSocket.io.on('reconnect', (attempt) => {
    console.log(`[Socket] Reconnected after ${attempt} attempts`);
    setConnectionState('connected');
  });

  newSocket.io.on('reconnect_attempt', (attempt) => {
    console.log(`[Socket] Reconnection attempt ${attempt}`);
    setConnectionState('connecting');
  });

  newSocket.io.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed');
    setConnectionState('error');
  });

  return newSocket;
}

/**
 * Socket client singleton API
 */
export const socketClient = {
  /**
   * Connects to the socket server
   * Uses stored auth token for authentication
   * Safe to call multiple times - will only connect once
   */
  connect(): void {
    // Don't connect on server side
    if (typeof window === 'undefined') return;

    // Already connected or connecting
    if (socket?.connected || connectionState === 'connecting') {
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('[Socket] Cannot connect: no auth token');
      return;
    }

    setConnectionState('connecting');

    // If socket exists but disconnected, reconnect
    if (socket) {
      // Update auth token in case it changed
      socket.auth = { token };
      socket.io.opts.query = { token };
      socket.connect();
      return;
    }

    // Create new socket connection
    socket = createSocket(token);
  },

  /**
   * Disconnects from the socket server
   * Cleans up all listeners and the socket instance
   */
  disconnect(): void {
    if (!socket) return;

    console.log('[Socket] Disconnecting...');

    // Remove all event listeners
    eventListeners.forEach((listeners, event) => {
      listeners.forEach((callback) => {
        socket?.off(event, callback);
      });
    });
    eventListeners.clear();

    // Disconnect and destroy socket
    socket.disconnect();
    socket = null;
    setConnectionState('disconnected');
  },

  /**
   * Subscribes to a socket event
   * Returns an unsubscribe function
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!socket) {
      console.warn(`[Socket] Cannot subscribe to ${event}: not connected`);
      return () => {};
    }

    // Track listener for cleanup
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(callback as EventCallback);

    // Add listener to socket
    socket.on(event, callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  },

  /**
   * Unsubscribes from a socket event
   */
  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (!socket) return;

    // Remove from tracking
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback as EventCallback);
      if (listeners.size === 0) {
        eventListeners.delete(event);
      }
    }

    // Remove from socket
    socket.off(event, callback);
  },

  /**
   * Emits an event to the server
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (!socket?.connected) {
      console.warn(`[Socket] Cannot emit ${event}: not connected`);
      return;
    }

    socket.emit(event, data);
  },

  /**
   * Emits an event and waits for acknowledgment
   */
  emitWithAck<T = unknown, R = unknown>(event: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit(event, data, (response: R) => {
        resolve(response);
      });
    });
  },

  /**
   * Returns whether the socket is currently connected
   */
  isConnected(): boolean {
    return socket?.connected || false;
  },

  /**
   * Returns the current connection state
   */
  getState(): ConnectionState {
    return connectionState;
  },

  /**
   * Returns the socket ID (useful for excluding self from broadcasts)
   */
  getSocketId(): string | undefined {
    return socket?.id;
  },

  /**
   * Subscribes to connection state changes
   * Returns an unsubscribe function
   */
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    stateListeners.add(listener);
    // Call immediately with current state
    listener(connectionState);

    return () => {
      stateListeners.delete(listener);
    };
  },

  /**
   * Forces reconnection with fresh token
   * Useful after token refresh
   */
  reconnect(): void {
    if (typeof window === 'undefined') return;

    const token = getToken();
    if (!token) {
      console.warn('[Socket] Cannot reconnect: no auth token');
      return;
    }

    if (socket) {
      // Update token and reconnect
      socket.auth = { token };
      socket.io.opts.query = { token };
      socket.disconnect().connect();
    } else {
      this.connect();
    }
  },
};

// Export socket events for easy access
export { SOCKET_EVENTS };
