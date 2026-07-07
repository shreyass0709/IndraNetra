import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context not found');
    }

    console.log('[RolesGuard] Request User:', user);
    console.log('[RolesGuard] Required Roles:', requiredRoles);
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      console.log('[RolesGuard] Access Denied: User role', user.role, 'is not in', requiredRoles);
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
