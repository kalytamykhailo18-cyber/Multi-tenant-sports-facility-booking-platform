// Response Transform Interceptor
// Wraps all successful responses in a consistent format

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Standard success response interface
export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// Paginated response interface
export interface PaginatedSuccessResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already in success format, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Check if this is a paginated response (has data array and pagination info)
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'total' in data &&
          'page' in data
        ) {
          const paginatedData = data as {
            data: T[];
            total: number;
            page: number;
            limit: number;
          };

          const totalPages = Math.ceil(paginatedData.total / paginatedData.limit);

          return {
            success: true,
            data: paginatedData.data,
            pagination: {
              total: paginatedData.total,
              page: paginatedData.page,
              limit: paginatedData.limit,
              totalPages,
              hasNextPage: paginatedData.page < totalPages,
              hasPrevPage: paginatedData.page > 1,
            },
            timestamp: new Date().toISOString(),
          } as unknown as SuccessResponse<T>;
        }

        // Standard response
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
