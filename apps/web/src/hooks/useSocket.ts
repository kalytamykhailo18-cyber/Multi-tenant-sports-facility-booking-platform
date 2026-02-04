// Socket Hook
// Provides socket functionality to React components
// Handles subscription/unsubscription on mount/unmount

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { socketClient, SOCKET_EVENTS } from '@/lib/socket';

// Connection state type
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Event callback type
type EventCallback<T = unknown> = (data: T) => void;

/**
 * Hook to access socket connection state and methods
 * Components use this hook to interact with the WebSocket
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  // Track state changes
  useEffect(() => {
    const unsubscribe = socketClient.onStateChange((state) => {
      setConnectionState(state);
      setIsConnected(state === 'connected');
    });

    return unsubscribe;
  }, []);

  // Subscribe to an event
  const subscribe = useCallback(<T = unknown>(
    event: string,
    callback: EventCallback<T>,
  ): (() => void) => {
    return socketClient.on(event, callback);
  }, []);

  // Unsubscribe from an event
  const unsubscribe = useCallback(<T = unknown>(
    event: string,
    callback: EventCallback<T>,
  ): void => {
    socketClient.off(event, callback);
  }, []);

  // Emit an event
  const emit = useCallback(<T = unknown>(event: string, data?: T): void => {
    socketClient.emit(event, data);
  }, []);

  // Emit with acknowledgment
  const emitWithAck = useCallback(<T = unknown, R = unknown>(
    event: string,
    data?: T,
  ): Promise<R> => {
    return socketClient.emitWithAck<T, R>(event, data);
  }, []);

  // Connect to socket
  const connect = useCallback((): void => {
    socketClient.connect();
  }, []);

  // Disconnect from socket
  const disconnect = useCallback((): void => {
    socketClient.disconnect();
  }, []);

  // Get socket ID
  const getSocketId = useCallback((): string | undefined => {
    return socketClient.getSocketId();
  }, []);

  return {
    isConnected,
    connectionState,
    subscribe,
    unsubscribe,
    emit,
    emitWithAck,
    connect,
    disconnect,
    getSocketId,
  };
}

/**
 * Hook to subscribe to a specific socket event
 * Automatically cleans up on unmount
 */
export function useSocketEvent<T = unknown>(
  event: string,
  callback: EventCallback<T>,
  enabled: boolean = true,
): void {
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Create stable wrapper that uses ref
    const handler = (data: T) => {
      callbackRef.current(data);
    };

    const unsubscribe = socketClient.on(event, handler);

    return () => {
      unsubscribe();
    };
  }, [event, enabled]);
}

/**
 * Hook to manage socket connection lifecycle with auth
 * Call this once at the app level (e.g., in a layout or provider)
 */
export function useSocketConnection(isAuthenticated: boolean): void {
  useEffect(() => {
    if (isAuthenticated) {
      // Connect when authenticated
      socketClient.connect();
    } else {
      // Disconnect when not authenticated
      socketClient.disconnect();
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect here - let the auth state handle it
      // This prevents disconnects on HMR or route changes
    };
  }, [isAuthenticated]);
}

/**
 * Hook for booking-related socket events
 * Convenient wrapper for common booking event patterns
 */
export function useBookingEvents(handlers: {
  onCreated?: EventCallback<any>;
  onUpdated?: EventCallback<any>;
  onCancelled?: EventCallback<any>;
  onStatusChanged?: EventCallback<any>;
  onPaymentReceived?: EventCallback<any>;
}): void {
  useSocketEvent(SOCKET_EVENTS.BOOKING_CREATED, handlers.onCreated ?? (() => {}), !!handlers.onCreated);
  useSocketEvent(SOCKET_EVENTS.BOOKING_UPDATED, handlers.onUpdated ?? (() => {}), !!handlers.onUpdated);
  useSocketEvent(SOCKET_EVENTS.BOOKING_CANCELLED, handlers.onCancelled ?? (() => {}), !!handlers.onCancelled);
  useSocketEvent(SOCKET_EVENTS.BOOKING_STATUS_CHANGED, handlers.onStatusChanged ?? (() => {}), !!handlers.onStatusChanged);
  useSocketEvent(SOCKET_EVENTS.BOOKING_PAYMENT_RECEIVED, handlers.onPaymentReceived ?? (() => {}), !!handlers.onPaymentReceived);
}

/**
 * Hook for customer-related socket events
 */
export function useCustomerEvents(handlers: {
  onCreated?: EventCallback;
  onUpdated?: EventCallback;
}): void {
  useSocketEvent(SOCKET_EVENTS.CUSTOMER_CREATED, handlers.onCreated ?? (() => {}), !!handlers.onCreated);
  useSocketEvent(SOCKET_EVENTS.CUSTOMER_UPDATED, handlers.onUpdated ?? (() => {}), !!handlers.onUpdated);
}

/**
 * Hook for escalation-related socket events
 */
export function useEscalationEvents(handlers: {
  onCreated?: EventCallback;
  onResolved?: EventCallback;
}): void {
  useSocketEvent(SOCKET_EVENTS.ESCALATION_CREATED, handlers.onCreated ?? (() => {}), !!handlers.onCreated);
  useSocketEvent(SOCKET_EVENTS.ESCALATION_RESOLVED, handlers.onResolved ?? (() => {}), !!handlers.onResolved);
}

/**
 * Hook for notification events
 */
export function useNotificationEvents(handlers: {
  onNew?: EventCallback;
}): void {
  useSocketEvent(SOCKET_EVENTS.NOTIFICATION_NEW, handlers.onNew ?? (() => {}), !!handlers.onNew);
}

/**
 * Hook for payment-related socket events
 * Handles real-time payment updates
 */
export function usePaymentEvents(handlers: {
  onCreated?: EventCallback;
  onUpdated?: EventCallback;
  onStatusChanged?: EventCallback;
}): void {
  useSocketEvent(SOCKET_EVENTS.PAYMENT_CREATED, handlers.onCreated ?? (() => {}), !!handlers.onCreated);
  useSocketEvent(SOCKET_EVENTS.PAYMENT_UPDATED, handlers.onUpdated ?? (() => {}), !!handlers.onUpdated);
  useSocketEvent(SOCKET_EVENTS.PAYMENT_STATUS_CHANGED, handlers.onStatusChanged ?? (() => {}), !!handlers.onStatusChanged);
}

// Export socket events for convenience
export { SOCKET_EVENTS };
