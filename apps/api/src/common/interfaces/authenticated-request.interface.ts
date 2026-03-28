import { Request } from 'express';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkspaceRole } from '../enums/workspace-role.enum';
import { BoardRole } from '../enums/board-role.enum';

export interface AuthenticatedRequest extends Request {
  user: UserEntity;
  workspaceId?: string;
  workspaceRole?: WorkspaceRole;
  boardId?: string;
  boardRole?: BoardRole;
}

