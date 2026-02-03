// Current User Decorator
// Extracts the current user from the request

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../modules/auth/strategies/jwt.strategy';

/**
 * Extracts the current authenticated user from the request
 * Must be used after JwtAuthGuard
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   return this.service.getProfile(user.id);
 * }
 *
 * @example
 * @Get('tenant')
 * getTenant(@CurrentUser('tenantId') tenantId: string) {
 *   return this.service.getTenant(tenantId);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      return null;
    }

    // If a specific property is requested, return just that
    if (data) {
      return user[data];
    }

    // Otherwise return the full user object
    return user;
  },
);
