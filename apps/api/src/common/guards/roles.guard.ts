import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '../enums/workspace-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly roleLevels: Record<WorkspaceRole, number> = {
    [WorkspaceRole.OWNER]: 4,
    [WorkspaceRole.ADMIN]: 3,
    [WorkspaceRole.MEMBER]: 2,
    [WorkspaceRole.GUEST]: 1,
  };

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userRole = request.workspaceRole;

    if (!userRole) {
      throw new ForbiddenException('Workspace role not found in request context');
    }

    const userLevel = this.roleLevels[userRole] || 0;
    const hasRequiredRole = requiredRoles.some((role) => {
      const requiredLevel = this.roleLevels[role];
      return userLevel >= requiredLevel;
    });

    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient workspace permissions');
    }

    return true;
  }
}
