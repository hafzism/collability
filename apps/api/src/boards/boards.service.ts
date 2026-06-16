import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Board,
  BoardMember,
  BoardNotificationType,
  Label,
} from '@repo/database';
import { BoardRole } from '../common/enums/board-role.enum';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import sanitizeHtml from 'sanitize-html';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';

const sanitize = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

@Injectable()
export class BoardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async logBoardActivity(
    tx: PrismaService | any,
    input: {
      workspaceId: string;
      userId: string;
      boardId: string;
      action: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.activityService.log(tx, {
      workspaceId: input.workspaceId,
      userId: input.userId,
      entityType: 'board',
      entityId: input.boardId,
      action: input.action,
      metadata: input.metadata,
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
        labels: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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

  async createBoardLabel(
    boardId: string,
    actorUserId: string,
    name: string,
    color: string,
  ): Promise<Label> {
    const board = await this.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const label = await this.prisma.label.create({
      data: {
        boardId,
        name: sanitize(name),
        color,
      },
    });

    await this.logBoardActivity(this.prisma, {
      workspaceId: board.workspaceId,
      userId: actorUserId,
      boardId,
      action: 'board.label_created',
      metadata: {
        labelId: label.id,
        labelName: label.name,
        color: label.color,
      },
    });

    return label;
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

      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

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
          action: 'board.member_added',
          metadata: {
            targetUserId: userId,
            targetUserName: targetUser?.name ?? 'Someone',
            role: membership.role,
          },
        });
        await this.notificationsService.createBoardNotification(tx, {
          boardId,
          userId,
          actorUserId,
          type: BoardNotificationType.BOARD_MEMBER_ADDED,
          title: 'Added to a board',
          body: `You were added to "${board.title}" as ${membership.role.toLowerCase()}`,
          entityType: 'board',
          entityId: boardId,
          metadata: {
            boardId,
            boardTitle: board.title,
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
        include: {
          user: {
            select: {
              name: true,
            },
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
        action: 'board.member_role_changed',
        metadata: {
          targetUserId: userId,
          targetUserName: existingMembership.user.name,
          oldRole: existingMembership.role,
          newRole: role,
        },
      });
      await this.notificationsService.createBoardNotification(tx, {
        boardId,
        userId,
        actorUserId,
        type: BoardNotificationType.BOARD_ROLE_CHANGED,
        title: 'Board role changed',
        body: `Your role on "${board.title}" changed to ${role.toLowerCase()}`,
        entityType: 'board',
        entityId: boardId,
        metadata: {
          boardId,
          boardTitle: board.title,
          oldRole: existingMembership.role,
          newRole: role,
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

    const membership = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
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
        action: 'board.member_removed',
        metadata: {
          targetUserId: userId,
          targetUserName: membership.user.name,
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
          boardTitle: board.title,
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
        ...accessFilter,
      },
      take: limit,
      skip: offset,
    });
  }

  async updateBoard(
    boardId: string,
    actorUserId: string,
    data: Partial<Pick<Board, 'title' | 'description' | 'visibility'>>,
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

      if (
        data.title !== undefined &&
        data.title !== existingBoard.title
      ) {
        await this.logBoardActivity(tx, {
          workspaceId: existingBoard.workspaceId,
          userId: actorUserId,
          boardId,
          action: 'board.renamed',
          metadata: {
            oldTitle: existingBoard.title,
            newTitle: board.title,
          },
        });
      }

      if (
        data.description !== undefined &&
        (data.description ?? null) !== (existingBoard.description ?? null)
      ) {
        await this.logBoardActivity(tx, {
          workspaceId: existingBoard.workspaceId,
          userId: actorUserId,
          boardId,
          action: 'board.description_changed',
          metadata: {
            boardTitle: board.title,
          },
        });
      }

      if (
        data.visibility !== undefined &&
        data.visibility !== existingBoard.visibility
      ) {
        await this.logBoardActivity(tx, {
          workspaceId: existingBoard.workspaceId,
          userId: actorUserId,
          boardId,
          action: 'board.visibility_changed',
          metadata: {
            boardTitle: board.title,
            oldVisibility: existingBoard.visibility,
            newVisibility: board.visibility,
          },
        });
      }

      return board;
    });
  }

  async deleteBoard(boardId: string, actorUserId: string): Promise<Board> {
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        throw new NotFoundException('Board not found');
      }

      const deletedBoard = await tx.board.delete({
        where: { id: boardId },
      });

      await this.logBoardActivity(tx, {
        workspaceId: board.workspaceId,
        userId: actorUserId,
        boardId,
        action: 'board.deleted',
        metadata: {
          boardTitle: board.title,
        },
      });

      return deletedBoard;
    });
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

      return {
        id: log.id,
        label: this.activityService.formatBoardActivity({
          id: log.id,
          action: log.action,
          createdAt: log.createdAt,
          metadata: log.metadata,
          user: {
            name: actorName,
          },
        }),
        timestamp: log.createdAt,
      };
    });
  }
}
