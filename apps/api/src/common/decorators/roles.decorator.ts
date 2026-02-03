// Roles Decorator
// Specifies required roles for a route

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@sports-booking/database';

export const ROLES_KEY = 'roles';

/**
 * Specifies which roles can access a route
 * SUPER_ADMIN can always access any route
 *
 * @example
 * @Roles('OWNER', 'SUPER_ADMIN')
 * @Get('settings')
 * getSettings() { ... }
 *
 * @example
 * @Roles('SUPER_ADMIN')
 * @Post('facilities')
 * createFacility() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
