import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { WorkspaceRole } from '../enums/workspace-role.enum';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly workspacesService: WorkspacesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const workspaceId =
      request.params?.workspaceId ||
      request.body?.workspaceId ||
      request.query?.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID is required');
    }

    const membership = await this.workspacesService.getWorkspaceMembership(user.id, workspaceId);
    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    request.workspaceMembership = membership;
    request.workspaceRole = membership.role as WorkspaceRole;

    return true;
  }
}
