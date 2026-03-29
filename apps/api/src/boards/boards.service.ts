import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Board, BoardMember } from '@repo/database';
import { BoardRole } from '../common/enums/board-role.enum';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBoardById(id: string): Promise<Board | null> {
    return this.prisma.board.findUnique({
      where: { id },
    });
  }

  async getBoardMembership(userId: string, boardId: string): Promise<BoardMember | null> {
    return this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });
  }

  async addMember(boardId: string, userId: string, role: BoardRole): Promise<BoardMember> {
    const board = await this.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const workspaceMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMembership) {
      throw new ForbiddenException('User must be a member of the workspace to be added to the board');
    }

    const existing = await this.getBoardMembership(userId, boardId);
    if (existing) {
      throw new ConflictException('User is already a member of this board');
    }

    return this.prisma.boardMember.create({
      data: {
        boardId,
        userId,
        role,
      },
    });
  }

  async removeMember(boardId: string, userId: string): Promise<void> {
    const membership = await this.getBoardMembership(userId, boardId);
    if (!membership) {
      throw new NotFoundException('Board member not found');
    }

    await this.prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });
  }

  async createBoard(workspaceId: string, userId: string, title: string, description?: string, visibility: 'WORKSPACE' | 'PRIVATE' = 'WORKSPACE'): Promise<Board> {
    return this.prisma.board.create({
      data: {
        workspaceId,
        createdBy: userId,
        title,
        description,
        visibility,
        members: {
          create: {
            userId,
            role: 'EDITOR'
          }
        }
      }
    });
  }

  async findWorkspaceBoards(workspaceId: string, userId: string, includeArchived = false): Promise<Board[]> {
    return this.prisma.board.findMany({
      where: {
        workspaceId,
        archived: includeArchived ? undefined : false,
        OR: [
          { visibility: 'WORKSPACE' },
          { members: { some: { userId } } }
        ]
      }
    });
  }

  async updateBoard(boardId: string, data: Partial<Pick<Board, 'title' | 'description' | 'visibility' | 'archived'>>): Promise<Board> {
    return this.prisma.board.update({
      where: { id: boardId },
      data,
    });
  }

  async deleteBoard(boardId: string): Promise<Board> {
    return this.prisma.board.delete({
      where: { id: boardId },
    });
  }
}
