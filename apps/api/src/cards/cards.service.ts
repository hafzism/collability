import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Card } from '@repo/database';

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

  async createCard(boardId: string, listId: string, userId: string, data: { title: string; description?: string; position: number; dueDate?: string | Date }): Promise<Card> {
    await this.validateListBoardAccess(listId, boardId);

    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

    return this.prisma.card.create({
      data: {
        listId,
        createdBy: userId,
        title: data.title,
        description: data.description,
        position: data.position,
        dueDate,
      },
    });
  }

  async getListCards(boardId: string, listId: string, includeArchived = false): Promise<Card[]> {
    return this.prisma.card.findMany({
      where: {
        listId,
        list: {
          boardId,
        },
        archived: includeArchived ? undefined : false,
      },
      orderBy: { position: 'asc' },
    });
  }

  async updateCard(boardId: string, listId: string, cardId: string, data: Partial<Pick<Card, 'title' | 'description' | 'position' | 'dueDate' | 'archived' | 'listId'>>): Promise<Card> {
    await this.validateListBoardAccess(listId, boardId);

    if (data.listId && data.listId !== listId) {
      await this.validateListBoardAccess(data.listId, boardId);
    }

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

    return this.prisma.card.delete({
      where: { id: cardId },
    });
  }
}
