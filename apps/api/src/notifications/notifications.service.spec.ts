import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const prismaService = {
    boardNotification: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    dueDateReminder: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const boardEventsService = {
    emitUserNotification: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
        callback(prismaService as any),
    );
    service = new NotificationsService(
      prismaService as any,
      boardEventsService as any,
    );
  });

  it('lists board notifications for the current user newest first', async () => {
    prismaService.boardNotification.findMany.mockResolvedValue([
      { id: 'notification-1' },
    ]);

    await expect(
      service.listBoardNotifications('board-1', 'user-1'),
    ).resolves.toEqual([{ id: 'notification-1' }]);

    expect(prismaService.boardNotification.findMany).toHaveBeenCalledWith({
      where: {
        boardId: 'board-1',
        userId: 'user-1',
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30,
    });
  });

  it('counts unread board notifications for the current user', async () => {
    prismaService.boardNotification.count.mockResolvedValue(3);

    await expect(
      service.getUnreadBoardNotificationCount('board-1', 'user-1'),
    ).resolves.toEqual({ unreadCount: 3 });

    expect(prismaService.boardNotification.count).toHaveBeenCalledWith({
      where: {
        boardId: 'board-1',
        userId: 'user-1',
        readAt: null,
      },
    });
  });

  it('marks a user-owned board notification as read', async () => {
    prismaService.boardNotification.findFirst.mockResolvedValue({
      id: 'notification-1',
      readAt: null,
    });
    prismaService.boardNotification.update.mockResolvedValue({
      id: 'notification-1',
      readAt: new Date('2026-06-14T10:00:00.000Z'),
    });

    await expect(
      service.markBoardNotificationRead(
        'board-1',
        'notification-1',
        'user-1',
      ),
    ).resolves.toEqual({
      id: 'notification-1',
      readAt: new Date('2026-06-14T10:00:00.000Z'),
    });

    expect(prismaService.boardNotification.update).toHaveBeenCalledWith({
      where: {
        id: 'notification-1',
      },
      data: {
        readAt: expect.any(Date),
      },
    });
  });

  it('throws when marking a notification outside the board or user scope', async () => {
    prismaService.boardNotification.findFirst.mockResolvedValue(null);

    await expect(
      service.markBoardNotificationRead(
        'board-1',
        'notification-1',
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('replaces pending due-date reminders with one same-day morning reminder per assignee', async () => {
    jest.useFakeTimers().setSystemTime(
      new Date('2026-06-14T10:00:00.000Z'),
    );
    prismaService.dueDateReminder.createMany.mockResolvedValue({ count: 2 });

    await service.replaceCardDueDateReminders(prismaService as any, {
      boardId: 'board-1',
      cardId: 'card-1',
      dueDate: new Date('2026-06-15T18:30:00.000Z'),
      assigneeIds: ['user-1', 'user-2'],
    });

    expect(prismaService.dueDateReminder.deleteMany).toHaveBeenCalledWith({
      where: {
        cardId: 'card-1',
        status: 'PENDING',
      },
    });
    expect(prismaService.dueDateReminder.createMany).toHaveBeenCalledWith({
      data: [
        {
          boardId: 'board-1',
          cardId: 'card-1',
          userId: 'user-1',
          dueDate: new Date('2026-06-15T18:30:00.000Z'),
          remindAt: new Date('2026-06-15T09:00:00.000Z'),
        },
        {
          boardId: 'board-1',
          cardId: 'card-1',
          userId: 'user-2',
          dueDate: new Date('2026-06-15T18:30:00.000Z'),
          remindAt: new Date('2026-06-15T09:00:00.000Z'),
        },
      ],
      skipDuplicates: true,
    });

    jest.useRealTimers();
  });

  it('processes due reminders into board notifications', async () => {
    const remindAt = new Date('2026-06-14T10:00:00.000Z');
    prismaService.dueDateReminder.findMany.mockResolvedValue([
      {
        id: 'reminder-1',
        boardId: 'board-1',
        cardId: 'card-1',
        userId: 'user-1',
        dueDate: new Date('2026-06-14T12:00:00.000Z'),
        remindAt,
        card: {
          title: 'Ship notifications',
          dueDate: new Date('2026-06-14T12:00:00.000Z'),
          assignees: [{ userId: 'user-1' }],
        },
      },
    ]);
    prismaService.dueDateReminder.updateMany.mockResolvedValue({ count: 1 });
    prismaService.boardNotification.create.mockResolvedValue({
      id: 'notification-1',
      boardId: 'board-1',
      userId: 'user-1',
    });
    prismaService.dueDateReminder.update.mockResolvedValue({
      id: 'reminder-1',
      status: 'SENT',
    });

    await service.processDueDateReminders(remindAt);

    expect(prismaService.boardNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          boardId: 'board-1',
          userId: 'user-1',
          type: 'CARD_DUE_REMINDER',
          entityType: 'card',
          entityId: 'card-1',
        }),
      }),
    );
    expect(prismaService.dueDateReminder.update).toHaveBeenCalledWith({
      where: {
        id: 'reminder-1',
      },
      data: {
        notificationId: 'notification-1',
        status: 'SENT',
        sentAt: expect.any(Date),
      },
    });
  });
});
