import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Card } from '@repo/database';
import sanitizeHtml from 'sanitize-html';
import { ActivityService } from '../activity/activity.service';
import { BoardsService } from '../boards/boards.service';
import type { BoardCardDueState } from './dto/search-board-cards.dto';

const sanitize = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly boardsService: BoardsService,
  ) {}

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
    await this.activityService.log(tx, {
      workspaceId: input.workspaceId,
      userId: input.userId,
      entityType: 'card',
      entityId: input.cardId,
      action: input.action,
      metadata: input.metadata,
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

  private getBoardCardSearchWhere(
    boardId: string,
    filters: {
      query?: string;
      assigneeIds?: string[];
      labelIds?: string[];
      creatorIds?: string[];
      listIds?: string[];
      dueFrom?: Date;
      dueTo?: Date;
      dueState?: BoardCardDueState;
      unassigned?: boolean;
      withoutDueDate?: boolean;
    },
  ) {
    const where: Record<string, unknown> = {
      list: {
        boardId,
      },
    };
    const trimmedQuery = filters.query?.trim();

    if (filters.listIds?.length) {
      where.list = {
        boardId,
        id: {
          in: filters.listIds,
        },
      };
    }

    if (filters.creatorIds?.length) {
      where.createdBy = {
        in: filters.creatorIds,
      };
    }

    if (filters.assigneeIds?.length) {
      where.assignees = {
        some: {
          userId: {
            in: filters.assigneeIds,
          },
        },
      };
    }

    if (filters.unassigned) {
      where.assignees = {
        none: {},
      };
    }

    if (filters.labelIds?.length) {
      where.labels = {
        some: {
          labelId: {
            in: filters.labelIds,
          },
        },
      };
    }

    if (trimmedQuery) {
      where.OR = [
        {
          title: {
            contains: trimmedQuery,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: trimmedQuery,
            mode: 'insensitive',
          },
        },
      ];
    }

    const dueDateFilter: Record<string, Date> = {};

    if (filters.dueFrom) {
      dueDateFilter.gte = filters.dueFrom;
    }

    if (filters.dueTo) {
      dueDateFilter.lte = filters.dueTo;
    }

    if (filters.dueState) {
      const now = new Date();

      if (filters.dueState === 'overdue') {
        dueDateFilter.lt = now;
      }

      if (filters.dueState === 'today') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        dueDateFilter.gte = startOfDay;
        dueDateFilter.lte = endOfDay;
      }

      if (filters.dueState === 'this_week') {
        const dayOfWeek = now.getDay();
        const offsetFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - offsetFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        dueDateFilter.gte = startOfWeek;
        dueDateFilter.lte = endOfWeek;
      }
    }

    if (filters.withoutDueDate) {
      where.dueDate = null;
    } else if (Object.keys(dueDateFilter).length > 0) {
      where.dueDate = dueDateFilter;
    }

    return where;
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

  private async logAssignmentAndLabelChanges(
    tx: any,
    input: {
      workspaceId: string;
      boardId: string;
      cardId: string;
      cardTitle: string;
      actorUserId: string;
      beforeAssignees: Array<{ userId: string; user: { name: string } }>;
      afterAssignees: Array<{ userId: string; user: { name: string } }>;
      beforeLabels: Array<{ labelId: string; label: { name: string } }>;
      afterLabels: Array<{ labelId: string; label: { name: string } }>;
    },
  ) {
    const beforeAssigneeIds = new Set(input.beforeAssignees.map((item) => item.userId));
    const afterAssigneeIds = new Set(input.afterAssignees.map((item) => item.userId));

    for (const assignee of input.afterAssignees) {
      if (beforeAssigneeIds.has(assignee.userId)) {
        continue;
      }

      const metadata = {
        cardTitle: input.cardTitle,
        targetUserId: assignee.userId,
        targetUserName: assignee.user.name,
      };

      await this.boardsService.logBoardActivity(tx, {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        boardId: input.boardId,
        action: 'card.assignee_added',
        metadata,
      });
      await this.logCardActivity(tx, {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        cardId: input.cardId,
        action: 'card.assignee_added',
        metadata,
      });
    }

    for (const assignee of input.beforeAssignees) {
      if (afterAssigneeIds.has(assignee.userId)) {
        continue;
      }

      const metadata = {
        cardTitle: input.cardTitle,
        targetUserId: assignee.userId,
        targetUserName: assignee.user.name,
      };

      await this.boardsService.logBoardActivity(tx, {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        boardId: input.boardId,
        action: 'card.assignee_removed',
        metadata,
      });
      await this.logCardActivity(tx, {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        cardId: input.cardId,
        action: 'card.assignee_removed',
        metadata,
      });
    }

    const beforeLabelIds = new Set(input.beforeLabels.map((item) => item.labelId));
    const afterLabelIds = new Set(input.afterLabels.map((item) => item.labelId));

    for (const label of input.afterLabels) {
      if (beforeLabelIds.has(label.labelId)) {
        continue;
      }

      await this.logCardActivity(tx, {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        cardId: input.cardId,
        action: 'card.label_added',
        metadata: {
          cardTitle: input.cardTitle,
          labelId: label.labelId,
          labelName: label.label.name,
        },
      });
    }

    for (const label of input.beforeLabels) {
      if (afterLabelIds.has(label.labelId)) {
        continue;
      }

      await this.logCardActivity(tx, {
        workspaceId: input.workspaceId,
        userId: input.actorUserId,
        cardId: input.cardId,
        action: 'card.label_removed',
        metadata: {
          cardTitle: input.cardTitle,
          labelId: label.labelId,
          labelName: label.label.name,
        },
      });
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
        const board = await tx.board.findUnique({
          where: { id: list.boardId },
          select: { workspaceId: true },
        });

        if (!board) {
          throw new NotFoundException('Board not found');
        }

        await this.boardsService.logBoardActivity(tx, {
          workspaceId: board.workspaceId,
          userId,
          boardId,
          action: 'card.created',
          metadata: {
            cardId: card.id,
            cardTitle: card.title,
            listId,
            listTitle: (await tx.list.findUnique({
              where: { id: listId },
              select: { title: true },
            }))?.title ?? '',
          },
        });

        await this.logCardActivity(tx, {
          workspaceId: board.workspaceId,
          userId,
          cardId: card.id,
          action: 'card.created',
          metadata: {
            cardTitle: card.title,
          },
        });

        const createdCard = await tx.card.findUnique({
          where: { id: card.id },
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            labels: {
              include: {
                label: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        await this.logAssignmentAndLabelChanges(tx, {
          workspaceId: board.workspaceId,
          boardId,
          cardId: card.id,
          cardTitle: card.title,
          actorUserId: userId,
          beforeAssignees: [],
          afterAssignees: createdCard?.assignees ?? [],
          beforeLabels: [],
          afterLabels: createdCard?.labels ?? [],
        });

        if (dueDate) {
          await this.logCardActivity(tx, {
            workspaceId: board.workspaceId,
            userId,
            cardId: card.id,
            action: 'card.due_date_added',
            metadata: {
              cardTitle: card.title,
              newDueDate: dueDate.toISOString(),
            },
          });
        }
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

  async moveCard(
    boardId: string,
    listId: string,
    cardId: string,
    targetListId: string,
    beforeId?: string,
    afterId?: string,
    actorUserId?: string,
  ): Promise<Card> {
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

      const [fromList, toList, board] = await Promise.all([
        tx.list.findUnique({ where: { id: listId }, select: { title: true } }),
        tx.list.findUnique({ where: { id: targetListId }, select: { title: true } }),
        tx.board.findUnique({ where: { id: boardId }, select: { workspaceId: true } }),
      ]);
      if (!fromList || !toList || !board) {
        throw new NotFoundException('Board or list not found');
      }

      const position = await this.calculatePosition(tx, targetListId, beforeId, afterId);

      const movedCard = await tx.card.update({
        where: { id: cardId },
        data: { 
          listId: targetListId,
          position 
        },
      });

      const metadata = {
        cardTitle: card.title,
        fromListId: listId,
        fromListTitle: fromList.title,
        toListId: targetListId,
        toListTitle: toList.title,
      };

      await this.boardsService.logBoardActivity(tx, {
        workspaceId: board.workspaceId,
        userId: actorUserId ?? card.createdBy,
        boardId,
        action: 'card.moved',
        metadata,
      });
      await this.logCardActivity(tx, {
        workspaceId: board.workspaceId,
        userId: actorUserId ?? card.createdBy,
        cardId,
        action: 'card.moved',
        metadata,
      });

      return movedCard;
    });
  }

  async getListCards(boardId: string, listId: string, limit = 50, offset = 0): Promise<any[]> {
    return this.prisma.card.findMany({
      where: {
        listId,
        list: {
          boardId,
        },
      },
      orderBy: { position: 'asc' },
      take: limit,
      skip: offset,
      include: this.cardInclude,
    });
  }

  async searchBoardCards(
    boardId: string,
    filters: {
      query?: string;
      assigneeIds?: string[];
      labelIds?: string[];
      creatorIds?: string[];
      listIds?: string[];
      dueFrom?: Date;
      dueTo?: Date;
      dueState?: BoardCardDueState;
      unassigned?: boolean;
      withoutDueDate?: boolean;
    },
  ): Promise<any[]> {
    return this.prisma.card.findMany({
      where: this.getBoardCardSearchWhere(boardId, filters),
      orderBy: [
        {
          list: {
            position: 'asc',
          },
        },
        {
          position: 'asc',
        },
      ],
      include: this.cardInclude,
    });
  }

  async updateCard(
    boardId: string,
    listId: string,
    cardId: string,
    actorUserId: string,
    data: Partial<
      Pick<Card, 'title' | 'description' | 'dueDate'>
    > & { labelIds?: string[]; assigneeIds?: string[] },
  ): Promise<any> {
    await this.validateListBoardAccess(listId, boardId);

    const card = await this.prisma.card.findFirst({
      where: { 
        id: cardId, 
        listId,
        list: { boardId }
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        labels: {
          include: {
            label: {
              select: {
                name: true,
              },
            },
          },
        },
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
        const updatedCard = await tx.card.findUnique({
          where: { id: cardId },
          include: {
            assignees: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            labels: {
              include: {
                label: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            list: {
              select: {
                title: true,
              },
            },
          },
        });

        if (cardData.title !== undefined && cardData.title !== card.title) {
          await this.logCardActivity(tx, {
            workspaceId: board.workspaceId,
            userId: actorUserId,
            cardId,
            action: 'card.title_changed',
            metadata: {
              oldTitle: card.title,
              newTitle: cardData.title,
            },
          });
        }

        if (
          cardData.description !== undefined &&
          (cardData.description ?? null) !== (card.description ?? null)
        ) {
          await this.logCardActivity(tx, {
            workspaceId: board.workspaceId,
            userId: actorUserId,
            cardId,
            action: 'card.description_changed',
            metadata: {
              cardTitle: updatedCard?.title ?? card.title,
            },
          });
        }

        if (
          cardData.dueDate !== undefined &&
          (cardData.dueDate?.toISOString() ?? null) !== (card.dueDate?.toISOString() ?? null)
        ) {
          const action =
            card.dueDate === null
              ? 'card.due_date_added'
              : cardData.dueDate === null
                ? 'card.due_date_removed'
                : 'card.due_date_changed';

          await this.logCardActivity(tx, {
            workspaceId: board.workspaceId,
            userId: actorUserId,
            cardId,
            action,
            metadata: {
              oldDueDate: card.dueDate?.toISOString(),
              newDueDate: cardData.dueDate?.toISOString(),
            },
          });
        }

        await this.logAssignmentAndLabelChanges(tx, {
          workspaceId: board.workspaceId,
          boardId,
          cardId,
          cardTitle: updatedCard?.title ?? card.title,
          actorUserId,
          beforeAssignees: card.assignees,
          afterAssignees: updatedCard?.assignees ?? [],
          beforeLabels: card.labels,
          afterLabels: updatedCard?.labels ?? [],
        });
      }

      return tx.card.findUnique({
        where: { id: cardId },
        include: this.cardInclude,
      });
    });
  }

  async deleteCard(
    boardId: string,
    listId: string,
    cardId: string,
    actorUserId: string,
  ): Promise<Card> {
    const card = await this.prisma.card.findFirst({
      where: { 
        id: cardId, 
        listId,
        list: { boardId }
      },
      include: {
        list: {
          select: {
            board: {
              select: {
                workspaceId: true,
              },
            },
            title: true,
          },
        },
      },
    });

    if (!card) throw new NotFoundException('Card not found');

    return this.prisma.$transaction(async (tx) => {
      const deletedCard = await tx.card.delete({
        where: { id: cardId },
      });

      await this.boardsService.logBoardActivity(tx, {
        workspaceId: card.list.board.workspaceId,
        userId: actorUserId,
        boardId,
        action: 'card.deleted',
        metadata: {
          cardId,
          cardTitle: card.title,
          listId,
          listTitle: card.list.title,
        },
      });
      await this.logCardActivity(tx, {
        workspaceId: card.list.board.workspaceId,
        userId: actorUserId,
        cardId,
        action: 'card.deleted',
        metadata: {
          cardTitle: card.title,
        },
      });

      return deletedCard;
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
      return {
        id: log.id,
        label: this.activityService.formatCardActivity({
          id: log.id,
          action: log.action,
          createdAt: log.createdAt,
          metadata: log.metadata,
          user: {
            name: log.user.name,
          },
        }),
        timestamp: log.createdAt,
      };
    });
  }
}
