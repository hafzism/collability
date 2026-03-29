import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { List } from '@repo/database';

@Injectable()
export class ListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardsService: BoardsService,
  ) {}

  async createList(boardId: string, title: string, position: number): Promise<List> {
    const board = await this.boardsService.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.prisma.list.create({
      data: {
        boardId,
        title,
        position,
      },
    });
  }

  async getBoardLists(boardId: string, includeArchived = false): Promise<List[]> {
    return this.prisma.list.findMany({
      where: {
        boardId,
        archived: includeArchived ? undefined : false,
      },
      orderBy: { position: 'asc' },
    });
  }

  async updateList(boardId: string, listId: string, data: Partial<Pick<List, 'title' | 'position' | 'archived'>>): Promise<List> {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, boardId },
    });
    
    if (!list) throw new NotFoundException('List not found');

    return this.prisma.list.update({
      where: { id: listId },
      data,
    });
  }

  async deleteList(boardId: string, listId: string): Promise<List> {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, boardId },
    });
    
    if (!list) throw new NotFoundException('List not found');

    return this.prisma.list.delete({
      where: { id: listId },
    });
  }
}
