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

  async createList(boardId: string, title: string): Promise<List> {
    const board = await this.boardsService.getBoardById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "Board" WHERE id = ${boardId} FOR UPDATE`;

      const lastList = await tx.list.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' },
      });

      const position = lastList ? BigInt(lastList.position) + 1000n : 1000n;

      return tx.list.create({
        data: {
          boardId,
          title: sanitize(title),
          position,
        },
      });
    });
  }

  private async rebalancePositions(tx: any, boardId: string): Promise<void> {
    const lists = await tx.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < lists.length; i++) {
        const newPosition = BigInt((i + 1) * 1000);
        if (lists[i].position !== newPosition) {
            await tx.list.update({
                where: { id: lists[i].id },
                data: { position: newPosition },
            });
        }
    }
  }

  private async calculatePosition(
    tx: any,
    boardId: string,
    beforeId?: string,
    afterId?: string,
  ): Promise<bigint> {
    if (!beforeId && !afterId) {
      const last = await tx.list.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' },
      });
      return last ? BigInt(last.position) + 1000n : 1000n;
    }

    if (!beforeId && afterId) {
      const after = await tx.list.findUnique({ where: { id: afterId } });
      if (!after || after.boardId !== boardId) throw new NotFoundException('After list not found in this board');
      
      return BigInt(after.position) - 1000n;
    }

    if (beforeId && !afterId) {
      const before = await tx.list.findUnique({ where: { id: beforeId } });
      if (!before || before.boardId !== boardId) throw new NotFoundException('Before list not found in this board');
      return BigInt(before.position) + 1000n;
    }

    const before = await tx.list.findUnique({ where: { id: beforeId } });
    const after = await tx.list.findUnique({ where: { id: afterId } });

    if (!before || !after || before.boardId !== boardId || after.boardId !== boardId) {
      throw new NotFoundException('Surrounding lists not found in this board');
    }

    const beforePos = BigInt(before.position);
    const afterPos = BigInt(after.position);

    if (beforePos >= afterPos) {
      await this.rebalancePositions(tx, boardId);
      return this.calculatePosition(tx, boardId, beforeId, afterId);
    }
    
    const gap = afterPos - beforePos;
    if (gap <= 1n) {
      await this.rebalancePositions(tx, boardId);
      return this.calculatePosition(tx, boardId, beforeId, afterId);
    }

    return beforePos + (gap / 2n);
  }

  async reorderList(boardId: string, listId: string, beforeId?: string, afterId?: string): Promise<List> {
    const listCheck = await this.prisma.list.findFirst({
      where: { id: listId, boardId },
    });
    if (!listCheck) throw new NotFoundException('List not found in this board');

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "Board" WHERE id = ${boardId} FOR UPDATE`;

      const list = await tx.list.findFirst({
        where: { id: listId, boardId },
      });
      if (!list) throw new NotFoundException('List not found');

      const position = await this.calculatePosition(tx, boardId, beforeId, afterId);

      return tx.list.update({
        where: { id: listId },
        data: { position },
      });
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

  async updateList(boardId: string, listId: string, data: { title?: string; archived?: boolean }): Promise<List> {
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
