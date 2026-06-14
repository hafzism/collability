import { CardsService } from './cards.service';
import { BoardNotificationType } from '@repo/database';

describe('CardsService', () => {
  let service: CardsService;

  const prismaService = {
    card: {
      delete: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const activityService = {
    log: jest.fn(),
  };

  const boardsService = {
    logBoardActivity: jest.fn(),
  };

  const notificationsService = {
    createBoardNotification: jest.fn(),
    replaceCardDueDateReminders: jest.fn(),
    cancelCardDueDateReminders: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
        callback(prismaService as any),
    );
    activityService.log.mockResolvedValue(undefined);
    boardsService.logBoardActivity.mockResolvedValue(undefined);
    service = new (CardsService as any)(
      prismaService as any,
      activityService as any,
      boardsService as any,
      notificationsService as any,
    );
  });

  it('deletes cards instead of archiving them', async () => {
    prismaService.card.findFirst.mockResolvedValue({
      id: 'card-1',
      title: 'Ship billing page',
      list: {
        title: 'Doing',
        board: {
          workspaceId: 'workspace-1',
        },
      },
    });
    prismaService.card.delete.mockResolvedValue({
      id: 'card-1',
      title: 'Ship billing page',
    });

    await expect(
      service.deleteCard('board-1', 'list-1', 'card-1', 'user-1'),
    ).resolves.toEqual({
      id: 'card-1',
      title: 'Ship billing page',
    });

    expect(prismaService.card.delete).toHaveBeenCalledWith({
      where: { id: 'card-1' },
    });
    expect(boardsService.logBoardActivity).toHaveBeenCalledWith(
      prismaService,
      {
        workspaceId: 'workspace-1',
        userId: 'user-1',
        boardId: 'board-1',
        action: 'card.deleted',
        metadata: {
          cardId: 'card-1',
          cardTitle: 'Ship billing page',
          listId: 'list-1',
          listTitle: 'Doing',
        },
      },
    );
    expect(activityService.log).toHaveBeenCalledWith(
      prismaService,
      {
        workspaceId: 'workspace-1',
        userId: 'user-1',
        entityType: 'card',
        entityId: 'card-1',
        action: 'card.deleted',
        metadata: {
          cardTitle: 'Ship billing page',
        },
      },
    );
  });

  it('searches board cards by keyword and relational filters', async () => {
    prismaService.card.findMany.mockResolvedValue([{ id: 'card-1' }]);

    await expect(
      service.searchBoardCards('board-1', {
        query: 'billing',
        assigneeIds: ['user-1'],
        labelIds: ['label-1'],
        creatorIds: ['user-2'],
        listIds: ['list-2'],
      }),
    ).resolves.toEqual([{ id: 'card-1' }]);

    expect(prismaService.card.findMany).toHaveBeenCalledWith({
      where: {
        list: {
          boardId: 'board-1',
          id: {
            in: ['list-2'],
          },
        },
        createdBy: {
          in: ['user-2'],
        },
        assignees: {
          some: {
            userId: {
              in: ['user-1'],
            },
          },
        },
        labels: {
          some: {
            labelId: {
              in: ['label-1'],
            },
          },
        },
        OR: [
          {
            title: {
              contains: 'billing',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: 'billing',
              mode: 'insensitive',
            },
          },
        ],
      },
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
      include: expect.any(Object),
    });
  });

  it('applies overdue and unassigned board-card filters', async () => {
    prismaService.card.findMany.mockResolvedValue([]);

    const now = new Date('2026-06-14T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(now);

    await service.searchBoardCards('board-1', {
      dueState: 'overdue',
      unassigned: true,
      withoutDueDate: false,
    });

    expect(prismaService.card.findMany).toHaveBeenCalledWith({
      where: {
        list: {
          boardId: 'board-1',
        },
        dueDate: {
          lt: now,
        },
        assignees: {
          none: {},
        },
      },
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
      include: expect.any(Object),
    });

    jest.useRealTimers();
  });

  it('notifies newly assigned users when card assignees change', async () => {
    prismaService.list = {
      findUnique: jest.fn().mockResolvedValue({ id: 'list-1', boardId: 'board-1' }),
    };
    prismaService.card.findFirst.mockResolvedValue({
      id: 'card-1',
      title: 'Ship reminders',
      description: null,
      dueDate: null,
      assignees: [],
      labels: [],
    });
    prismaService.card.update = jest.fn().mockResolvedValue({ id: 'card-1' });
    prismaService.card.findUnique = jest.fn().mockResolvedValue({
      id: 'card-1',
      title: 'Ship reminders',
      assignees: [
        {
          userId: 'user-2',
          user: {
            name: 'Aaray',
          },
        },
      ],
      labels: [],
      list: {
        title: 'Doing',
      },
    });
    prismaService.board = {
      findUnique: jest.fn().mockResolvedValue({ workspaceId: 'workspace-1' }),
    };
    prismaService.boardMember = {
      findMany: jest.fn().mockResolvedValue([{ userId: 'user-2' }]),
    };
    prismaService.cardAssignee = {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    prismaService.cardLabel = {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    };
    notificationsService.createBoardNotification.mockResolvedValue({
      id: 'notification-1',
    });

    await service.updateCard('board-1', 'list-1', 'card-1', 'user-1', {
      assigneeIds: ['user-2'],
    });

    expect(notificationsService.createBoardNotification).toHaveBeenCalledWith(
      prismaService,
      expect.objectContaining({
        boardId: 'board-1',
        userId: 'user-2',
        actorUserId: 'user-1',
        type: BoardNotificationType.CARD_ASSIGNED,
        entityType: 'card',
        entityId: 'card-1',
      }),
    );
  });

  it('replaces due-date reminders when an assigned card due date changes', async () => {
    const newDueDate = new Date('2026-06-20T10:00:00.000Z');
    prismaService.list = {
      findUnique: jest.fn().mockResolvedValue({ id: 'list-1', boardId: 'board-1' }),
    };
    prismaService.card.findFirst.mockResolvedValue({
      id: 'card-1',
      title: 'Ship reminders',
      description: null,
      dueDate: null,
      assignees: [
        {
          userId: 'user-2',
          user: {
            name: 'Aaray',
          },
        },
      ],
      labels: [],
    });
    prismaService.card.update = jest.fn().mockResolvedValue({ id: 'card-1' });
    prismaService.card.findUnique = jest.fn().mockResolvedValue({
      id: 'card-1',
      title: 'Ship reminders',
      dueDate: newDueDate,
      assignees: [
        {
          userId: 'user-2',
          user: {
            name: 'Aaray',
          },
        },
      ],
      labels: [],
      list: {
        title: 'Doing',
      },
    });
    prismaService.board = {
      findUnique: jest.fn().mockResolvedValue({ workspaceId: 'workspace-1' }),
    };

    await service.updateCard('board-1', 'list-1', 'card-1', 'user-1', {
      dueDate: newDueDate,
    });

    expect(notificationsService.replaceCardDueDateReminders).toHaveBeenCalledWith(
      prismaService,
      {
        boardId: 'board-1',
        cardId: 'card-1',
        dueDate: newDueDate,
        assigneeIds: ['user-2'],
      },
    );
  });
});
