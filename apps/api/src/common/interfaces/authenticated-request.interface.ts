import { Request } from 'express';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkspaceRole } from '../enums/workspace-role.enum';
import { WorkspaceMember } from '@repo/database';

export interface AuthenticatedRequest extends Request {
  user: UserEntity;
  workspaceMembership?: WorkspaceMember;
  workspaceRole?: WorkspaceRole;
}
