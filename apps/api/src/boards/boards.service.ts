import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Board, BoardMember } from '@repo/database';
import { BoardRole } from '../common/enums/board-role.enum';
import sanitizeHtml from 'sanitize-html';

const sanitize = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

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
    return this.prisma.$transaction(async (tx) => {
      const board = await tx.board.findUnique({
        where: { id: boardId }
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
        throw new ForbiddenException('User must be a member of the workspace to be added to the board');
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
          role,
        },
      });
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
        title: sanitize(title),
        description: description ? sanitize(description) : undefined,
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

  async findWorkspaceBoards(workspaceId: string, userId: string, includeArchived = false, limit = 50, offset = 0): Promise<Board[]> {
    return this.prisma.board.findMany({
      where: {
        workspaceId,
        archived: includeArchived ? undefined : false,
        OR: [
          { visibility: 'WORKSPACE' },
          { members: { some: { userId } } }
        ]
      },
      take: limit,
      skip: offset,
    });
  }

  async updateBoard(boardId: string, data: Partial<Pick<Board, 'title' | 'description' | 'visibility' | 'archived'>>): Promise<Board> {
    if (data.title) data.title = sanitize(data.title);
    if (data.description) data.description = sanitize(data.description);
    
    return this.prisma.board.update({
      where: { id: boardId },
      data,
    });
  }

  async deleteBoard(boardId: string): Promise<Board> {
    return this.prisma.board.update({
      where: { id: boardId },
      data: { archived: true },
    });
  }
}
