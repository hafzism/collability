import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Board, BoardMember } from '@repo/database';

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
}
