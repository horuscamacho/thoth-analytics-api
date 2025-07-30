import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../decorators/roles.decorator';

// Role hierarchy: Super Admin > Director Comunicacion > Líder > Director Área > Asistente
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 5, // Super administrador del sistema
  DIRECTOR_COMUNICACION: 4, // Acceso completo
  LIDER: 3, // Vista ejecutiva (Gobernador/Presidente)
  DIRECTOR_AREA: 2, // Acceso a su área específica
  ASISTENTE: 1, // Acceso limitado
} as const;

type UserRole = keyof typeof ROLE_HIERARCHY;

interface IAuthenticatedUser {
  id: string;
  role: UserRole;
  email: string;
  tenantId: string;
}

interface IRequestWithUser {
  user?: IAuthenticatedUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles === null || requiredRoles === undefined || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest<IRequestWithUser>();
    const user = request.user;

    if (user === null || user === undefined) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = user.role;
    const userRoleLevel = ROLE_HIERARCHY[userRole];

    if (typeof userRoleLevel !== 'number') {
      throw new ForbiddenException('Invalid user role');
    }

    // Check if user has any of the required roles or higher
    const hasPermission = requiredRoles.some((role) => {
      const requiredRoleLevel = ROLE_HIERARCHY[role as UserRole];
      return userRoleLevel >= requiredRoleLevel;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`,
      );
    }

    return true;
  }
}
