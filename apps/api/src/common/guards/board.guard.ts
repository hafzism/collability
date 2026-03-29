import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BoardsService } from '../../boards/boards.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { WorkspaceRole } from '../enums/workspace-role.enum';
import { BoardRole } from '../enums/board-role.enum';
import { REQUIRE_BOARD_ROLE_KEY } from '../decorators/require-board-role.decorator';

@Injectable()
export class BoardGuard implements CanActivate {
  private readonly logger = new Logger(BoardGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly boardsService: BoardsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const boardId =
      request.params?.boardId ||
      request.body?.boardId ||
      request.query?.boardId;

    if (!boardId) {
      throw new ForbiddenException('Board ID is required');
    }

    const board = await this.boardsService.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    let workspaceRole = request.workspaceRole;
    if (!workspaceRole) {
      workspaceRole = await this.workspacesService.getWorkspaceRole(user.id, board.workspaceId) as WorkspaceRole | undefined;
    }

    if (!workspaceRole) {
      this.logger.warn(`User ${user.id} denied access to Board ${boardId}: Not a workspace member`);
      throw new ForbiddenException('You must be a member of the workspace to access this board');
    }

    if (board.archived) {
      if (workspaceRole !== WorkspaceRole.OWNER && workspaceRole !== WorkspaceRole.ADMIN) {
        this.logger.warn(`User ${user.id} denied access to archived Board ${boardId}`);
        throw new ForbiddenException('This board is archived and can only be accessed by workspace admins');
      }
    }

    const boardMember = await this.boardsService.getBoardMembership(user.id, boardId);
    let boardRole: BoardRole;

    if (boardMember) {
      boardRole = boardMember.role as BoardRole;
    } else {
      if (board.visibility === 'PRIVATE') {
        this.logger.warn(`User ${user.id} denied access to private Board ${boardId}`);
        throw new ForbiddenException('You do not have access to this private board');
      }
      
      boardRole = (workspaceRole === WorkspaceRole.OWNER || workspaceRole === WorkspaceRole.ADMIN)
        ? BoardRole.EDITOR
        : BoardRole.VIEWER;
    }

    const requiredRole = this.reflector.getAllAndOverride<BoardRole>(REQUIRE_BOARD_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRole && requiredRole === BoardRole.EDITOR && boardRole !== BoardRole.EDITOR) {
      this.logger.warn(`User ${user.id} denied modifying Board ${boardId}: Requires EDITOR role`);
      throw new ForbiddenException('You must be a board editor to perform this action');
    }

    request.boardId = board.id;
    request.workspaceId = board.workspaceId;
    request.boardRole = boardRole;

    return true;
  }
}
