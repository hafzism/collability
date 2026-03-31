import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Card } from '@repo/database';
import sanitizeHtml from 'sanitize-html';

const sanitize = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateListBoardAccess(listId: string, boardId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
    });
    
    if (!list) {
      throw new NotFoundException('List not found');
    }
    
    if (list.boardId !== boardId) {
      throw new ForbiddenException('List does not belong to the specified board');
    }
    return list;
  }

  async createCard(boardId: string, listId: string, userId: string, data: { title: string; description?: string; dueDate?: string | Date }): Promise<Card> {
    await this.validateListBoardAccess(listId, boardId);

    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

    return this.prisma.$transaction(async (tx) => {
      // Row-level lock the list to prevent concurrent calculation races
      await tx.$executeRaw`SELECT 1 FROM "List" WHERE id = ${listId} FOR UPDATE`;

      const last = await tx.card.findFirst({
        where: { listId },
        orderBy: { position: 'desc' },
      });
      const position = last ? last.position + 1000n : 1000n;

      return tx.card.create({
        data: {
          listId,
          createdBy: userId,
          title: sanitize(data.title),
          description: data.description ? sanitize(data.description) : undefined,
          position,
          dueDate,
        },
      });
    });
  }

  private async rebalancePositions(tx: any, listId: string): Promise<void> {
    const cards = await tx.card.findMany({
      where: { listId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < cards.length; i++) {
        const newPosition = BigInt((i + 1) * 1000);
        if (cards[i].position !== newPosition) {
            await tx.card.update({
                where: { id: cards[i].id },
                data: { position: newPosition },
            });
        }
    }
  }

  private async calculatePosition(
    tx: any,
    listId: string,
    beforeId?: string,
    afterId?: string,
  ): Promise<bigint> {
    if (!beforeId && !afterId) {
      const last = await tx.card.findFirst({
        where: { listId },
        orderBy: { position: 'desc' },
      });
      return last ? BigInt(last.position) + 1000n : 1000n;
    }

    if (!beforeId && afterId) {
      const after = await tx.card.findUnique({ where: { id: afterId } });
      if (!after || after.listId !== listId) throw new NotFoundException('After card not found in this list');
      
      return BigInt(after.position) - 1000n;
    }

    if (beforeId && !afterId) {
      const before = await tx.card.findUnique({ where: { id: beforeId } });
      if (!before || before.listId !== listId) throw new NotFoundException('Before card not found in this list');
      return BigInt(before.position) + 1000n;
    }

    const before = await tx.card.findUnique({ where: { id: beforeId } });
    const after = await tx.card.findUnique({ where: { id: afterId } });

    if (!before || !after || before.listId !== listId || after.listId !== listId) {
      throw new NotFoundException('Surrounding cards not found in this list');
    }

    const beforePos = BigInt(before.position);
    const afterPos = BigInt(after.position);

    if (beforePos >= afterPos) {
      await this.rebalancePositions(tx, listId);
      return this.calculatePosition(tx, listId, beforeId, afterId);
    }
    
    const gap = afterPos - beforePos;
    if (gap <= 1n) {
      await this.rebalancePositions(tx, listId);
      return this.calculatePosition(tx, listId, beforeId, afterId);
    }

    return beforePos + (gap / 2n);
  }

  async reorderCard(boardId: string, listId: string, cardId: string, beforeId?: string, afterId?: string): Promise<Card> {
    await this.validateListBoardAccess(listId, boardId);
    
    return this.prisma.$transaction(async (tx) => {
      // Row-level lock the list
      await tx.$executeRaw`SELECT 1 FROM "List" WHERE id = ${listId} FOR UPDATE`;

      const card = await tx.card.findFirst({
        where: { id: cardId, listId },
      });
      if (!card) throw new NotFoundException('Card not found');

      const position = await this.calculatePosition(tx, listId, beforeId, afterId);

      return tx.card.update({
        where: { id: cardId },
        data: { position },
      });
    });
  }

  async moveCard(boardId: string, listId: string, cardId: string, targetListId: string, beforeId?: string, afterId?: string): Promise<Card> {
    await this.validateListBoardAccess(listId, boardId);
    await this.validateListBoardAccess(targetListId, boardId);

    return this.prisma.$transaction(async (tx) => {
      // Row-level lock both lists in deterministic order to prevent deadlocks
      const [firstLock, secondLock] = listId < targetListId 
          ? [listId, targetListId] 
          : [targetListId, listId];
          
      await tx.$executeRaw`SELECT 1 FROM "List" WHERE id = ${firstLock} FOR UPDATE`;
      await tx.$executeRaw`SELECT 1 FROM "List" WHERE id = ${secondLock} FOR UPDATE`;

      const card = await tx.card.findFirst({
        where: { id: cardId, listId },
      });
      if (!card) throw new NotFoundException('Card not found');

      const position = await this.calculatePosition(tx, targetListId, beforeId, afterId);

      return tx.card.update({
        where: { id: cardId },
        data: { 
          listId: targetListId,
          position 
        },
      });
    });
  }

  async getListCards(boardId: string, listId: string, includeArchived = false, limit = 50, offset = 0): Promise<Card[]> {
    return this.prisma.card.findMany({
      where: {
        listId,
        list: {
          boardId,
        },
        archived: includeArchived ? undefined : false,
      },
      orderBy: { position: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async updateCard(boardId: string, listId: string, cardId: string, data: Partial<Pick<Card, 'title' | 'description' | 'dueDate' | 'archived'>>): Promise<Card> {
    await this.validateListBoardAccess(listId, boardId);

    const card = await this.prisma.card.findFirst({
      where: { 
        id: cardId, 
        listId,
        list: { boardId }
      },
    });

    if (!card) throw new NotFoundException('Card not found');

    if (data.title) data = { ...data, title: sanitize(data.title) };
    if (data.description) data = { ...data, description: sanitize(data.description) };

    return this.prisma.card.update({
      where: { id: cardId },
      data,
    });
  }

  async deleteCard(boardId: string, listId: string, cardId: string): Promise<Card> {
    const card = await this.prisma.card.findFirst({
      where: { 
        id: cardId, 
        listId,
        list: { boardId }
      },
    });

    if (!card) throw new NotFoundException('Card not found');

    return this.prisma.card.update({
      where: { id: cardId },
      data: { archived: true },
    });
  }
}
