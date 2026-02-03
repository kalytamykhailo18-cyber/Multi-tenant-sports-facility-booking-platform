// Audit Log Service
// Provides comprehensive event traceability logging for debugging and audit trails

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  AuditLogEntry,
  AuditEventCategory,
  AuditEventType,
  AuditSeverity,
  CreateAuditLogOptions,
  AuditLogQueryOptions,
} from './audit.types';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly isDevelopment: boolean;

  // In-memory store for recent logs (for development/debugging)
  // In production, this would be stored in a database or external service
  private readonly recentLogs: AuditLogEntry[] = [];
  private readonly maxRecentLogs = 1000;

  constructor(private configService: ConfigService) {
    this.isDevelopment =
      this.configService.get<string>('app.nodeEnv') === 'development';
  }

  /**
   * Create a new audit log entry
   */
  log(options: CreateAuditLogOptions): AuditLogEntry {
    const entry = this.createLogEntry(options);

    // Store in memory (for quick access to recent logs)
    this.storeLog(entry);

    // Output to console logger based on severity
    this.outputToLogger(entry);

    return entry;
  }

  /**
   * Log an authentication event
   */
  logAuth(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.AUTH,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a WhatsApp message event
   */
  logWhatsApp(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.WHATSAPP,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a booking event
   */
  logBooking(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.BOOKING,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a payment event
   */
  logPayment(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.PAYMENT,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a calendar modification event
   */
  logCalendar(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.CALENDAR,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a customer event
   */
  logCustomer(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.CUSTOMER,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log an AI/Bot event
   */
  logAI(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.AI_BOT,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a subscription event
   */
  logSubscription(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.SUBSCRIPTION,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a facility event
   */
  logFacility(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.FACILITY,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log a system event
   */
  logSystem(
    eventType: AuditEventType,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category: AuditEventCategory.SYSTEM,
      eventType,
      severity: options.severity || AuditSeverity.INFO,
    });
  }

  /**
   * Log an error with full context
   */
  logError(
    category: AuditEventCategory,
    eventType: AuditEventType,
    error: Error,
    options: Omit<CreateAuditLogOptions, 'category' | 'eventType' | 'error'>,
  ): AuditLogEntry {
    return this.log({
      ...options,
      category,
      eventType,
      severity: AuditSeverity.ERROR,
      error: {
        code: (error as Error & { code?: string }).code,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      },
    });
  }

  /**
   * Query audit logs with filters
   */
  queryLogs(options: AuditLogQueryOptions): AuditLogEntry[] {
    let logs = [...this.recentLogs];

    // Apply filters
    if (options.tenantId) {
      logs = logs.filter((log) => log.tenantId === options.tenantId);
    }

    if (options.category) {
      logs = logs.filter((log) => log.category === options.category);
    }

    if (options.eventType) {
      logs = logs.filter((log) => log.eventType === options.eventType);
    }

    if (options.severity) {
      logs = logs.filter((log) => log.severity === options.severity);
    }

    if (options.entityType) {
      logs = logs.filter((log) => log.entity?.type === options.entityType);
    }

    if (options.entityId) {
      logs = logs.filter((log) => log.entity?.id === options.entityId);
    }

    if (options.actorId) {
      logs = logs.filter((log) => log.actor.id === options.actorId);
    }

    if (options.actorType) {
      logs = logs.filter((log) => log.actor.type === options.actorType);
    }

    if (options.startDate) {
      const startTime = options.startDate.getTime();
      logs = logs.filter((log) => new Date(log.timestamp).getTime() >= startTime);
    }

    if (options.endDate) {
      const endTime = options.endDate.getTime();
      logs = logs.filter((log) => new Date(log.timestamp).getTime() <= endTime);
    }

    // Sort by timestamp descending (newest first)
    logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    logs = logs.slice(offset, offset + limit);

    return logs;
  }

  /**
   * Get logs for a specific entity
   */
  getEntityLogs(
    entityType: string,
    entityId: string,
    limit?: number,
  ): AuditLogEntry[] {
    return this.queryLogs({
      entityType,
      entityId,
      limit: limit || 50,
    });
  }

  /**
   * Get logs for a specific tenant
   */
  getTenantLogs(tenantId: string, limit?: number): AuditLogEntry[] {
    return this.queryLogs({
      tenantId,
      limit: limit || 100,
    });
  }

  /**
   * Get recent error logs
   */
  getRecentErrors(limit?: number): AuditLogEntry[] {
    return this.queryLogs({
      severity: AuditSeverity.ERROR,
      limit: limit || 50,
    });
  }

  /**
   * Clear old logs (for cleanup)
   */
  clearOldLogs(olderThanHours: number): number {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    const initialCount = this.recentLogs.length;

    // Remove logs older than cutoff
    const index = this.recentLogs.findIndex(
      (log) => new Date(log.timestamp).getTime() < cutoffTime,
    );

    if (index !== -1) {
      this.recentLogs.splice(index);
    }

    return initialCount - this.recentLogs.length;
  }

  /**
   * Create a log entry with all required fields
   */
  private createLogEntry(options: CreateAuditLogOptions): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: uuidv4(),
      category: options.category,
      eventType: options.eventType,
      severity: options.severity || AuditSeverity.INFO,
      timestamp: new Date().toISOString(),
      tenantId: options.tenantId ?? null,
      actor: {
        type: options.actor?.type || 'SYSTEM',
        id: options.actor?.id || null,
        email: options.actor?.email,
        role: options.actor?.role,
        ip: options.actor?.ip,
      },
      action: options.action,
    };

    // Add optional fields if provided
    if (options.entity) {
      entry.entity = options.entity;
    }

    if (options.changes) {
      entry.changes = options.changes;
    }

    if (options.metadata) {
      entry.metadata = options.metadata;
    }

    if (options.error) {
      entry.error = options.error;
    }

    if (options.request) {
      entry.request = options.request;
    }

    return entry;
  }

  /**
   * Store log entry in memory
   */
  private storeLog(entry: AuditLogEntry): void {
    this.recentLogs.unshift(entry);

    // Keep only the most recent logs
    if (this.recentLogs.length > this.maxRecentLogs) {
      this.recentLogs.pop();
    }
  }

  /**
   * Output log entry to NestJS logger
   */
  private outputToLogger(entry: AuditLogEntry): void {
    const message = this.formatLogMessage(entry);

    switch (entry.severity) {
      case AuditSeverity.DEBUG:
        this.logger.debug(message);
        break;
      case AuditSeverity.INFO:
        this.logger.log(message);
        break;
      case AuditSeverity.WARN:
        this.logger.warn(message);
        break;
      case AuditSeverity.ERROR:
      case AuditSeverity.CRITICAL:
        this.logger.error(message, entry.error?.stack);
        break;
    }
  }

  /**
   * Format log entry for console output
   */
  private formatLogMessage(entry: AuditLogEntry): string {
    const parts: string[] = [];

    // Category and event type
    parts.push(`[${entry.category}:${entry.eventType}]`);

    // Tenant context
    if (entry.tenantId) {
      parts.push(`tenant:${entry.tenantId.substring(0, 8)}`);
    }

    // Actor info
    if (entry.actor.id) {
      parts.push(`actor:${entry.actor.type}:${entry.actor.id.substring(0, 8)}`);
    }

    // Entity info
    if (entry.entity) {
      parts.push(`entity:${entry.entity.type}:${entry.entity.id.substring(0, 8)}`);
    }

    // Action
    parts.push(entry.action);

    // Error message
    if (entry.error) {
      parts.push(`ERROR: ${entry.error.message}`);
    }

    return parts.join(' | ');
  }
}
