import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Board, BoardMember } from '@repo/database';
import { BoardRole } from '../common/enums/board-role.enum';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import sanitizeHtml from 'sanitize-html';

const sanitize = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async logBoardActivity(
    tx: PrismaService | any,
    input: {
      workspaceId: string;
      userId: string;
      boardId: string;
      action: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await tx.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        entityType: 'board',
        entityId: input.boardId,
        action: input.action,
        metadata: input.metadata,
      },
    });
  }

  async getBoardById(id: string): Promise<Board | null> {
    return this.prisma.board.findUnique({
      where: { id },
    });
  }

  async getBoardDetail(boardId: string) {
    return this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          orderBy: {
            addedAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getBoardMembership(
    userId: string,
    boardId: string,
  ): Promise<BoardMember | null> {
    return this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });
  }

  async addMember(
    boardId: string,
    userId: string,
    role: BoardRole,
    actorUserId: string,
  ): Promise<BoardMember> {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        throw new NotFoundException('Board not found');
      }

      const workspaceMembership = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: board.workspaceId,
            userId,
          },
        },
      });

      if (!workspaceMembership) {
        throw new ForbiddenException(
          'User must be a member of the workspace to be added to the board',
        );
      }

      const existing = await tx.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId,
            userId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('User is already a member of this board');
      }

      return tx.boardMember.create({
        data: {
          boardId,
          userId,
          role: board.createdBy === userId ? BoardRole.MANAGER : role,
        },
      }).then(async (membership) => {
        await this.logBoardActivity(tx, {
          workspaceId: board.workspaceId,
          userId: actorUserId,
          boardId,
          action: 'member.added',
          metadata: {
            targetUserId: userId,
            role: membership.role,
          },
        });

        return membership;
      });
    });
  }

  async updateMemberRole(
    boardId: string,
    userId: string,
    actorUserId: string,
    role: BoardRole,
  ): Promise<BoardMember> {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        throw new NotFoundException('Board not found');
      }

      if (board.createdBy === userId && role !== BoardRole.MANAGER) {
        throw new ForbiddenException('The board creator must remain a manager');
      }

      const existingMembership = await tx.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId,
            userId,
          },
        },
      });

      if (!existingMembership) {
        throw new NotFoundException('Board member not found');
      }

      const membership = await tx.boardMember.update({
        where: {
          boardId_userId: {
            boardId,
            userId,
          },
        },
        data: { role },
      });

      await this.logBoardActivity(tx, {
        workspaceId: board.workspaceId,
        userId: actorUserId,
        boardId,
        action: 'member.role_updated',
        metadata: {
          targetUserId: userId,
          role,
        },
      });

      return membership;
    });
  }

  async removeMember(
    boardId: string,
    userId: string,
    actorUserId?: string,
  ): Promise<void> {
    const board = await this.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (board.createdBy === userId) {
      throw new ForbiddenException('The board creator must remain a manager');
    }

    const membership = await this.getBoardMembership(userId, boardId);
    if (!membership) {
      throw new NotFoundException('Board member not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.boardMember.delete({
        where: {
          boardId_userId: {
            boardId,
            userId,
          },
        },
      });

      await this.logBoardActivity(tx, {
        workspaceId: board.workspaceId,
        userId: actorUserId ?? board.createdBy,
        boardId,
        action: 'member.removed',
        metadata: {
          targetUserId: userId,
        },
      });
    });
  }

  async createBoard(
    workspaceId: string,
    userId: string,
    title: string,
    description?: string,
    visibility: 'WORKSPACE' | 'PRIVATE' = 'WORKSPACE',
  ): Promise<Board> {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          workspaceId,
          createdBy: userId,
          title: sanitize(title),
          description: description ? sanitize(description) : undefined,
          visibility,
          members: {
            create: {
              userId,
              role: BoardRole.MANAGER,
            },
          },
        },
      });

      await this.logBoardActivity(tx, {
        workspaceId,
        userId,
        boardId: board.id,
        action: 'board.created',
        metadata: {
          title: board.title,
          visibility: board.visibility,
        },
      });

      return board;
    });
  }

  async findWorkspaceBoards(
    workspaceId: string,
    userId: string,
    workspaceRole: WorkspaceRole,
    includeArchived = false,
    limit = 50,
    offset = 0,
  ): Promise<Board[]> {
    const canViewPrivateBoards =
      workspaceRole === WorkspaceRole.OWNER ||
      workspaceRole === WorkspaceRole.ADMIN;
    const accessFilter = canViewPrivateBoards
      ? {}
      : {
          OR: [
            { visibility: 'WORKSPACE' as const },
            { members: { some: { userId } } },
            { createdBy: userId },
          ],
        };

    return this.prisma.board.findMany({
      where: {
        workspaceId,
        archived: includeArchived ? undefined : false,
        ...accessFilter,
      },
      take: limit,
      skip: offset,
    });
  }

  async updateBoard(
    boardId: string,
    actorUserId: string,
    data: Partial<
      Pick<Board, 'title' | 'description' | 'visibility' | 'archived'>
    >,
  ): Promise<Board> {
    if (data.title) data.title = sanitize(data.title);
    if (data.description) data.description = sanitize(data.description);

    return this.prisma.$transaction(async (tx) => {
      const existingBoard = await tx.board.findUnique({
        where: { id: boardId },
      });

      if (!existingBoard) {
        throw new NotFoundException('Board not found');
      }

      const board = await tx.board.update({
        where: { id: boardId },
        data,
      });

      await this.logBoardActivity(tx, {
        workspaceId: existingBoard.workspaceId,
        userId: actorUserId,
        boardId,
        action: board.archived ? 'board.archived' : 'board.updated',
        metadata: {
          title: board.title,
          visibility: board.visibility,
          archived: board.archived,
        },
      });

      return board;
    });
  }

  async deleteBoard(boardId: string, actorUserId: string): Promise<Board> {
    return this.updateBoard(boardId, actorUserId, { archived: true });
  }

  async getBoardActivity(boardId: string, limit = 20) {
    const board = await this.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const logs = await this.prisma.activityLog.findMany({
      where: {
        workspaceId: board.workspaceId,
        entityType: 'board',
        entityId: boardId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return logs.map((log) => {
      const metadata = (log.metadata ?? {}) as Record<string, unknown>;
      const actorName = log.user.name;

      let label = `${actorName} updated the board`;

      switch (log.action) {
        case 'board.created':
          label = `${actorName} created the board`;
          break;
        case 'board.archived':
          label = `${actorName} archived the board`;
          break;
        case 'member.added':
          label = `${actorName} added a board member`;
          break;
        case 'member.role_updated':
          label = `${actorName} changed a board member role to ${String(metadata.role ?? '').toLowerCase()}`;
          break;
        case 'member.removed':
          label = `${actorName} removed a board member`;
          break;
        case 'board.updated':
          label = `${actorName} updated board details`;
          break;
      }

      return {
        id: log.id,
        label,
        timestamp: log.createdAt,
      };
    });
  }
}
