import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Card } from '@repo/database';
import sanitizeHtml from 'sanitize-html';

const sanitize = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async logCardActivity(
    tx: PrismaService | any,
    input: {
      workspaceId: string;
      userId: string;
      cardId: string;
      action: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await tx.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        entityType: 'card',
        entityId: input.cardId,
        action: input.action,
        metadata: input.metadata,
      },
    });
  }

  private readonly cardInclude = {
    _count: {
      select: {
        comments: true,
      },
    },
    creator: {
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    },
    comments: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    assignees: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'asc' as const,
      },
    },
    labels: {
      include: {
        label: true,
      },
    },
  };

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

  async getCardDetail(boardId: string, listId: string, cardId: string): Promise<any> {
    await this.validateListBoardAccess(listId, boardId);

    const card = await this.prisma.card.findFirst({
      where: {
        id: cardId,
        listId,
        list: { boardId },
      },
      include: {
        ...this.cardInclude,
        list: {
          select: {
            id: true,
            title: true,
            boardId: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }

  private async assertBoardLabels(
    tx: any,
    boardId: string,
    labelIds: string[],
  ): Promise<void> {
    if (labelIds.length === 0) {
      return;
    }

    const labels = await tx.label.findMany({
      where: {
        boardId,
        id: { in: labelIds },
      },
      select: { id: true },
    });

    if (labels.length !== labelIds.length) {
      throw new ForbiddenException('One or more labels do not belong to this board');
    }
  }

  private async assertBoardAssignees(
    tx: any,
    boardId: string,
    assigneeIds: string[],
  ): Promise<void> {
    if (assigneeIds.length === 0) {
      return;
    }

    const members = await tx.boardMember.findMany({
      where: {
        boardId,
        userId: { in: assigneeIds },
      },
      select: { userId: true },
    });

    if (members.length !== assigneeIds.length) {
      throw new ForbiddenException('One or more assignees are not board members');
    }
  }

  private async syncCardRelations(
    tx: any,
    input: {
      cardId: string;
      boardId: string;
      labelIds?: string[];
      assigneeIds?: string[];
    },
  ) {
    if (input.labelIds) {
      await this.assertBoardLabels(tx, input.boardId, input.labelIds);
      await tx.cardLabel.deleteMany({
        where: { cardId: input.cardId },
      });

      if (input.labelIds.length > 0) {
        await tx.cardLabel.createMany({
          data: input.labelIds.map((labelId) => ({
            cardId: input.cardId,
            labelId,
          })),
        });
      }
    }

    if (input.assigneeIds) {
      await this.assertBoardAssignees(tx, input.boardId, input.assigneeIds);
      await tx.cardAssignee.deleteMany({
        where: { cardId: input.cardId },
      });

      if (input.assigneeIds.length > 0) {
        await tx.cardAssignee.createMany({
          data: input.assigneeIds.map((userId) => ({
            cardId: input.cardId,
            userId,
          })),
        });
      }
    }
  }

  async createCard(
    boardId: string,
    listId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      dueDate?: string | Date;
      labelIds?: string[];
      assigneeIds?: string[];
    },
  ): Promise<any> {
    await this.validateListBoardAccess(listId, boardId);

    const dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

    return this.prisma.$transaction(async (tx) => {
      // Row-level lock the list to prevent concurrent calculation races
      await tx.$executeRaw`SELECT 1 FROM "List" WHERE id = ${listId} FOR UPDATE`;
      const list = await tx.list.findUnique({
        where: { id: listId },
        select: { boardId: true },
      });

      const last = await tx.card.findFirst({
        where: { listId },
        orderBy: { position: 'desc' },
      });
      const position = last ? last.position + 1000n : 1000n;

      const card = await tx.card.create({
        data: {
          listId,
          createdBy: userId,
          title: sanitize(data.title),
          description: data.description ? sanitize(data.description) : undefined,
          position,
          dueDate,
        },
      });

      await this.syncCardRelations(tx, {
        cardId: card.id,
        boardId,
        labelIds: data.labelIds,
        assigneeIds: data.assigneeIds,
      });

      if (list) {
        await this.logCardActivity(tx, {
          workspaceId: (await tx.board.findUnique({
            where: { id: list.boardId },
            select: { workspaceId: true },
          }))!.workspaceId,
          userId,
          cardId: card.id,
          action: 'card.created',
          metadata: {
            title: card.title,
            listId,
          },
        });
      }

      return tx.card.findUnique({
        where: { id: card.id },
        include: this.cardInclude,
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

  async getListCards(boardId: string, listId: string, includeArchived = false, limit = 50, offset = 0): Promise<any[]> {
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
      include: this.cardInclude,
    });
  }

  async updateCard(
    boardId: string,
    listId: string,
    cardId: string,
    actorUserId: string,
    data: Partial<
      Pick<Card, 'title' | 'description' | 'dueDate' | 'archived'>
    > & { labelIds?: string[]; assigneeIds?: string[] },
  ): Promise<any> {
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

    return this.prisma.$transaction(async (tx) => {
      const { labelIds, assigneeIds, ...cardData } = data;

      await tx.card.update({
        where: { id: cardId },
        data: cardData,
      });

      await this.syncCardRelations(tx, {
        cardId,
        boardId,
        labelIds,
        assigneeIds,
      });

      const board = await tx.board.findUnique({
        where: { id: boardId },
        select: { workspaceId: true },
      });

      if (board) {
        await this.logCardActivity(tx, {
          workspaceId: board.workspaceId,
          userId: actorUserId,
          cardId,
          action: 'card.updated',
          metadata: {
            title: cardData.title ?? card.title,
          },
        });
      }

      return tx.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
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

  async createComment(
    boardId: string,
    listId: string,
    cardId: string,
    userId: string,
    content: string,
  ): Promise<any> {
    await this.validateListBoardAccess(listId, boardId);

    const card = await this.prisma.card.findFirst({
      where: {
        id: cardId,
        listId,
        list: { boardId },
      },
      include: {
        list: {
          select: {
            board: {
              select: {
                workspaceId: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          cardId,
          userId,
          content: sanitize(content),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      return comment;
    });
  }

  async getCardActivity(
    boardId: string,
    listId: string,
    cardId: string,
    limit = 20,
  ) {
    await this.validateListBoardAccess(listId, boardId);

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { workspaceId: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const logs = await this.prisma.activityLog.findMany({
      where: {
        workspaceId: board.workspaceId,
        entityType: 'card',
        entityId: cardId,
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
      let label = `${log.user.name} updated the card`;

      switch (log.action) {
        case 'card.created':
          label = `${log.user.name} created the card`;
          break;
        case 'card.updated':
          label = `${log.user.name} updated card details`;
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
