// Roles Guard
// Checks if user has required role(s) for the route

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@sports-booking/database';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../../modules/auth/strategies/jwt.strategy';

// Role hierarchy - higher index means more privileges
const ROLE_HIERARCHY: UserRole[] = ['STAFF', 'OWNER', 'SUPER_ADMIN'];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Checks if the user has the required role(s) for the route
   * SUPER_ADMIN can access everything
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN can access everything
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => this.checkRoleAccess(user.role as UserRole, role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Checks if user's role has access to the required role
   * Higher roles can access lower role routes
   */
  private checkRoleAccess(userRole: UserRole, requiredRole: UserRole): boolean {
    const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);

    // User can access if their role is equal or higher in hierarchy
    return userRoleIndex >= requiredRoleIndex;
  }
}
