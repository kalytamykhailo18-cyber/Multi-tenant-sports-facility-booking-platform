// Audit Interceptor
// Automatically logs HTTP request/response events for traceability

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from '../audit/audit.service';
import {
  AuditEventCategory,
  AuditEventType,
  AuditSeverity,
} from '../audit/audit.types';

// Request user interface (attached by JWT guard)
interface RequestUser {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
}

// Extended request with tenant context
interface AuditRequest extends Request {
  user?: RequestUser;
  tenantContext?: {
    tenantId: string | null;
    userId: string;
    userRole: string;
    isSuperAdmin: boolean;
    bypassTenantFilter: boolean;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<AuditRequest>();
    const response = httpContext.getResponse<Response>();

    const startTime = Date.now();
    const { method, url, body, headers, ip } = request;

    // Skip logging for certain endpoints (health checks, static files)
    if (this.shouldSkipLogging(url)) {
      return next.handle();
    }

    // Get user and tenant info from request
    const user = request.user;
    const tenantContext = request.tenantContext;

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Only log non-GET requests or important GET requests
        if (method !== 'GET' || this.isImportantEndpoint(url)) {
          this.logRequest(
            request,
            statusCode,
            duration,
            user,
            tenantContext?.tenantId,
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        // Log error requests
        this.logRequestError(
          request,
          error,
          duration,
          user,
          tenantContext?.tenantId,
        );

        throw error;
      }),
    );
  }

  private shouldSkipLogging(url: string): boolean {
    const skipPatterns = [
      /^\/api\/v1\/health/,
      /^\/docs/,
      /^\/favicon/,
      /\.js$/,
      /\.css$/,
      /\.map$/,
    ];

    return skipPatterns.some((pattern) => pattern.test(url));
  }

  private isImportantEndpoint(url: string): boolean {
    const importantPatterns = [
      /\/auth\//,
      /\/bookings/,
      /\/payments/,
      /\/tenants/,
      /\/facilities/,
      /\/customers/,
      /\/subscriptions/,
    ];

    return importantPatterns.some((pattern) => pattern.test(url));
  }

  private mapUrlToEventType(method: string, url: string): AuditEventType {
    // Map common endpoints to event types
    if (url.includes('/auth/login')) return AuditEventType.AUTH_LOGIN;
    if (url.includes('/auth/logout')) return AuditEventType.AUTH_LOGOUT;
    if (url.includes('/auth/register')) return AuditEventType.AUTH_REGISTER;

    if (url.includes('/bookings')) {
      switch (method) {
        case 'POST':
          return AuditEventType.BOOKING_CREATED;
        case 'PATCH':
        case 'PUT':
          return AuditEventType.BOOKING_UPDATED;
        case 'DELETE':
          return AuditEventType.BOOKING_CANCELLED;
        default:
          return AuditEventType.BOOKING_UPDATED;
      }
    }

    if (url.includes('/payments')) {
      switch (method) {
        case 'POST':
          return AuditEventType.PAYMENT_INITIATED;
        default:
          return AuditEventType.PAYMENT_WEBHOOK_RECEIVED;
      }
    }

    if (url.includes('/customers')) {
      switch (method) {
        case 'POST':
          return AuditEventType.CUSTOMER_CREATED;
        case 'PATCH':
        case 'PUT':
          return AuditEventType.CUSTOMER_UPDATED;
        default:
          return AuditEventType.CUSTOMER_UPDATED;
      }
    }

    if (url.includes('/subscriptions')) {
      switch (method) {
        case 'POST':
          return AuditEventType.SUBSCRIPTION_CREATED;
        case 'PATCH':
        case 'PUT':
          return AuditEventType.SUBSCRIPTION_RENEWED;
        default:
          return AuditEventType.SUBSCRIPTION_RENEWED;
      }
    }

    // Default event types based on HTTP method
    switch (method) {
      case 'POST':
        return AuditEventType.WEBHOOK_RECEIVED;
      case 'PATCH':
      case 'PUT':
      case 'DELETE':
        return AuditEventType.SYSTEM_WARNING;
      default:
        return AuditEventType.SYSTEM_WARNING;
    }
  }

  private mapUrlToCategory(url: string): AuditEventCategory {
    if (url.includes('/auth/')) return AuditEventCategory.AUTH;
    if (url.includes('/bookings')) return AuditEventCategory.BOOKING;
    if (url.includes('/payments') || url.includes('/webhooks/mercadopago'))
      return AuditEventCategory.PAYMENT;
    if (url.includes('/customers')) return AuditEventCategory.CUSTOMER;
    if (url.includes('/subscriptions')) return AuditEventCategory.SUBSCRIPTION;
    if (url.includes('/facilities') || url.includes('/courts'))
      return AuditEventCategory.FACILITY;
    if (url.includes('/webhooks/whatsapp')) return AuditEventCategory.WHATSAPP;

    return AuditEventCategory.SYSTEM;
  }

  private logRequest(
    request: AuditRequest,
    statusCode: number,
    duration: number,
    user?: RequestUser,
    tenantId?: string | null,
  ): void {
    const { method, url, body, ip } = request;
    const category = this.mapUrlToCategory(url);
    const eventType = this.mapUrlToEventType(method, url);

    this.auditService.log({
      category,
      eventType,
      severity: AuditSeverity.INFO,
      tenantId: tenantId ?? user?.tenantId,
      actor: user
        ? {
            type: 'USER',
            id: user.id,
            email: user.email,
            role: user.role,
            ip,
          }
        : {
            type: 'SYSTEM',
            id: null,
            ip,
          },
      action: `${method} ${url} - ${statusCode}`,
      metadata: {
        method,
        path: url,
        statusCode,
        duration,
        // Sanitize body to remove sensitive data
        body: this.sanitizeBody(body),
      },
      request: {
        method,
        path: url,
        ip,
        userAgent: request.headers['user-agent'],
      },
    });
  }

  private logRequestError(
    request: AuditRequest,
    error: Error & { status?: number },
    duration: number,
    user?: RequestUser,
    tenantId?: string | null,
  ): void {
    const { method, url, body, ip } = request;
    const category = this.mapUrlToCategory(url);
    const eventType = AuditEventType.SYSTEM_ERROR;

    this.auditService.log({
      category,
      eventType,
      severity: AuditSeverity.ERROR,
      tenantId: tenantId ?? user?.tenantId,
      actor: user
        ? {
            type: 'USER',
            id: user.id,
            email: user.email,
            role: user.role,
            ip,
          }
        : {
            type: 'SYSTEM',
            id: null,
            ip,
          },
      action: `${method} ${url} - ERROR`,
      error: {
        code: (error as Error & { code?: string }).code,
        message: error.message,
      },
      metadata: {
        method,
        path: url,
        duration,
        statusCode: error.status || 500,
      },
      request: {
        method,
        path: url,
        ip,
        userAgent: request.headers['user-agent'],
      },
    });
  }

  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body } as Record<string, unknown>;
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'apiSecret',
      'secret',
      'mercadopagoAccessToken',
      'whatsappApiKey',
      'whatsappApiSecret',
      'geminiApiKey',
      'whisperApiKey',
    ];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
