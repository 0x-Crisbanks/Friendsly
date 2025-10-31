import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Roles Decorator
 * Define required roles for a route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
