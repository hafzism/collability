import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardsService } from '../boards/boards.service';
import { List } from '@repo/database';
import sanitizeHtml from 'sanitize-html';

const sanitize = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

@Injectable()
export class ListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardsService: BoardsService,
  ) {}

  async createList(boardId: string, title: string, position: bigint): Promise<List> {
    const board = await this.boardsService.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.prisma.list.create({
      data: {
        boardId,
        title: sanitize(title),
        position: position as any,
      },
    });
  }

  async getBoardLists(boardId: string, includeArchived = false, limit = 50, offset = 0): Promise<List[]> {
    return this.prisma.list.findMany({
      where: {
        boardId,
        archived: includeArchived ? undefined : false,
      },
      orderBy: { position: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async updateList(boardId: string, listId: string, data: { title?: string; position?: bigint; archived?: boolean }): Promise<List> {
    const list = await this.prisma.list.findFirst({
      where: { id: listId, boardId },
    });
    
    if (!list) throw new NotFoundException('List not found');

    if (data.title) data = { ...data, title: sanitize(data.title) };

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

    return this.prisma.list.update({
      where: { id: listId },
      data: { archived: true },
    });
  }
}
