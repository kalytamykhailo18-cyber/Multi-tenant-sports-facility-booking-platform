// Global Exception Filter
// Catches all exceptions and returns standardized error responses

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

// Standard error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  statusCode: number;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request.url);

    // Log error details
    this.logError(exception, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(exception: unknown, path: string): ErrorResponse {
    const timestamp = new Date().toISOString();

    // Handle HttpException (NestJS standard exceptions)
    if (exception instanceof HttpException) {
      return this.handleHttpException(exception, path, timestamp);
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, path, timestamp);
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data provided',
        },
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp,
        path,
      };
    }

    // Handle unknown errors
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp,
      path,
    };
  }

  private handleHttpException(
    exception: HttpException,
    path: string,
    timestamp: string,
  ): ErrorResponse {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    let code = 'ERROR';
    let details: Record<string, string[]> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;

      // Handle validation errors from class-validator
      if (Array.isArray(responseObj.message)) {
        message = 'Validation failed';
        code = 'VALIDATION_ERROR';
        details = this.formatValidationErrors(responseObj.message);
      } else {
        message = (responseObj.message as string) || message;
      }

      code = (responseObj.error as string) || this.getErrorCodeFromStatus(status);
    }

    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      statusCode: status,
      timestamp,
      path,
    };
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    path: string,
    timestamp: string,
  ): ErrorResponse {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'DATABASE_ERROR';
    let message = 'A database error occurred';

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        statusCode = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        const target = (exception.meta?.target as string[])?.join(', ') || 'field';
        message = `A record with this ${target} already exists`;
        break;

      case 'P2025':
        // Record not found
        statusCode = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'The requested record was not found';
        break;

      case 'P2003':
        // Foreign key constraint violation
        statusCode = HttpStatus.BAD_REQUEST;
        code = 'INVALID_REFERENCE';
        message = 'Invalid reference to related record';
        break;

      case 'P2014':
        // Required relation violation
        statusCode = HttpStatus.BAD_REQUEST;
        code = 'RELATION_VIOLATION';
        message = 'The change violates a required relation';
        break;

      default:
        this.logger.error(
          `Unhandled Prisma error: ${exception.code}`,
          exception.message,
        );
    }

    return {
      success: false,
      error: {
        code,
        message,
      },
      statusCode,
      timestamp,
      path,
    };
  }

  private formatValidationErrors(
    errors: string[] | object[],
  ): Record<string, string[]> {
    const details: Record<string, string[]> = {};

    errors.forEach((error) => {
      if (typeof error === 'string') {
        // Simple string error, try to extract field name
        const fieldMatch = error.match(/^(\w+)\s/);
        const field = fieldMatch ? fieldMatch[1] : 'general';
        if (!details[field]) {
          details[field] = [];
        }
        details[field].push(error);
      } else if (typeof error === 'object' && error !== null) {
        // Object with property and constraints
        const errorObj = error as { property?: string; constraints?: Record<string, string> };
        const field = errorObj.property || 'general';
        if (!details[field]) {
          details[field] = [];
        }
        if (errorObj.constraints) {
          details[field].push(...Object.values(errorObj.constraints));
        }
      }
    });

    return details;
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_ERROR';
    }
  }

  private logError(exception: unknown, errorResponse: ErrorResponse): void {
    const { statusCode, error, path } = errorResponse;

    // Log 5xx errors as errors, others as warnings
    if (statusCode >= 500) {
      this.logger.error(
        `[${statusCode}] ${error.code}: ${error.message} - ${path}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${statusCode}] ${error.code}: ${error.message} - ${path}`,
      );
    }
  }
}
