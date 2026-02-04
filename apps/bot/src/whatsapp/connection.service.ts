// WhatsApp Connection Service using Baileys
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
  Browsers,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { logger } from '../config/logger.config';
import { envConfig } from '../config/env.config';
import path from 'path';
import fs from 'fs';

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  QR_READY = 'qr_ready',
  LOGGED_OUT = 'logged_out',
}

export interface WhatsAppConnection {
  socket: WASocket;
  status: ConnectionStatus;
  qrCode?: string; // Base64 QR code image
  facilityId: string;
}

// Store active connections per facility
const connections = new Map<string, WhatsAppConnection>();

export class WhatsAppConnectionService {
  /**
   * Connect facility to WhatsApp using QR code
   * Returns QR code for scanning with facility's phone
   */
  async connectWithQR(facilityId: string): Promise<{ qrCode: string }> {
    logger.info({ facilityId }, 'Initiating WhatsApp connection with QR code');

    // Check if already connected
    const existing = connections.get(facilityId);
    if (existing && existing.status === ConnectionStatus.CONNECTED) {
      logger.info({ facilityId }, 'Already connected');
      throw new Error('Already connected. Disconnect first to reconnect.');
    }

    try {
      // Setup session storage path for this facility
      const sessionPath = path.join(envConfig.SESSION_STORAGE_PATH, facilityId);

      // Ensure directory exists
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      // Load auth state from persistent storage
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

      // Create socket connection
      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: true, // For development/debugging
        browser: Browsers.ubuntu('Chrome'), // Simulate Chrome on Ubuntu
        logger: logger.child({ facilityId, component: 'baileys' }),
      });

      let qrCodeData: string | undefined;

      // Handle QR code event
      socket.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        // QR code generated
        if (qr) {
          logger.info({ facilityId }, 'QR code generated');

          // Generate QR code as base64 image
          qrCodeData = await QRCode.toDataURL(qr);

          // Update connection status
          const conn = connections.get(facilityId);
          if (conn) {
            conn.status = ConnectionStatus.QR_READY;
            conn.qrCode = qrCodeData;
          }

          // TODO Phase 7.11: Emit socket event to dashboard (QR code ready)
        }

        // Connection state changed
        if (connection) {
          logger.info({ facilityId, connection }, 'Connection state changed');

          if (connection === 'open') {
            logger.info({ facilityId }, '✅ WhatsApp connected successfully');

            // Update connection status
            const conn = connections.get(facilityId);
            if (conn) {
              conn.status = ConnectionStatus.CONNECTED;
            }

            // TODO Phase 7.11: Emit socket event to dashboard (connected)
            // TODO: Update facility.whatsappConnectedAt in database
          }

          if (connection === 'close') {
            const shouldReconnect =
              (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            logger.warn({ facilityId, shouldReconnect }, 'Connection closed');

            if (!shouldReconnect) {
              logger.error({ facilityId }, 'Logged out - need new QR scan');
              connections.delete(facilityId);

              // TODO Phase 7.11: Alert facility owner via dashboard
            } else {
              logger.info({ facilityId }, 'Reconnecting...');

              // Exponential backoff for reconnection
              setTimeout(() => {
                this.connectWithQR(facilityId).catch((err) => {
                  logger.error({ err, facilityId }, 'Reconnection failed');
                });
              }, 5000);
            }
          }
        }
      });

      // Save credentials on update
      socket.ev.on('creds.update', saveCreds);

      // Store connection
      connections.set(facilityId, {
        socket,
        status: ConnectionStatus.CONNECTING,
        facilityId,
      });

      // Wait for QR code to be generated (max 30 seconds)
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for QR code'));
        }, 30000);

        const interval = setInterval(() => {
          const conn = connections.get(facilityId);
          if (conn?.qrCode) {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve({ qrCode: conn.qrCode });
          }
        }, 500);
      });
    } catch (error) {
      logger.error({ error, facilityId }, 'Failed to initiate WhatsApp connection');
      connections.delete(facilityId);
      throw error;
    }
  }

  /**
   * Disconnect facility from WhatsApp
   */
  async disconnect(facilityId: string): Promise<void> {
    logger.info({ facilityId }, 'Disconnecting from WhatsApp');

    const connection = connections.get(facilityId);
    if (!connection) {
      logger.warn({ facilityId }, 'No connection found to disconnect');
      return;
    }

    try {
      await connection.socket.logout();
      connections.delete(facilityId);
      logger.info({ facilityId }, 'Disconnected successfully');
    } catch (error) {
      logger.error({ error, facilityId }, 'Failed to disconnect');
      throw error;
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(facilityId: string): ConnectionStatus {
    const connection = connections.get(facilityId);
    return connection?.status ?? ConnectionStatus.DISCONNECTED;
  }

  /**
   * Get socket for facility (for sending messages)
   */
  getSocket(facilityId: string): WASocket | null {
    const connection = connections.get(facilityId);
    if (!connection || connection.status !== ConnectionStatus.CONNECTED) {
      return null;
    }
    return connection.socket;
  }

  /**
   * Check if facility is connected
   */
  isConnected(facilityId: string): boolean {
    const status = this.getConnectionStatus(facilityId);
    return status === ConnectionStatus.CONNECTED;
  }

  /**
   * Get QR code for facility (if in QR_READY state)
   */
  getQRCode(facilityId: string): string | null {
    const connection = connections.get(facilityId);
    if (connection?.status === ConnectionStatus.QR_READY) {
      return connection.qrCode ?? null;
    }
    return null;
  }
}
