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
    boardNotificationSetting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const boardEventsService = {
    emitUserNotification: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
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

  it('returns default board notification settings when none exist', async () => {
    prismaService.boardNotificationSetting.findUnique.mockResolvedValue(null);

    await expect(
      service.getBoardNotificationSetting('board-1', 'user-1'),
    ).resolves.toEqual({
      boardId: 'board-1',
      userId: 'user-1',
      inAppEnabled: true,
      emailEnabled: false,
      dueReminderMinutes: [1440],
      mutedAt: null,
    });
  });

  it('updates board notification settings', async () => {
    prismaService.boardNotificationSetting.upsert.mockResolvedValue({
      id: 'setting-1',
      boardId: 'board-1',
      userId: 'user-1',
      inAppEnabled: true,
      emailEnabled: true,
      dueReminderMinutes: [60, 1440],
      mutedAt: null,
    });

    await expect(
      service.updateBoardNotificationSetting('board-1', 'user-1', {
        emailEnabled: true,
        dueReminderMinutes: [60, 1440],
      }),
    ).resolves.toEqual({
      id: 'setting-1',
      boardId: 'board-1',
      userId: 'user-1',
      inAppEnabled: true,
      emailEnabled: true,
      dueReminderMinutes: [60, 1440],
      mutedAt: null,
    });

    expect(prismaService.boardNotificationSetting.upsert).toHaveBeenCalledWith({
      where: {
        boardId_userId: {
          boardId: 'board-1',
          userId: 'user-1',
        },
      },
      create: {
        boardId: 'board-1',
        userId: 'user-1',
        inAppEnabled: true,
        emailEnabled: true,
        dueReminderMinutes: [60, 1440],
        mutedAt: null,
      },
      update: {
        emailEnabled: true,
        dueReminderMinutes: [60, 1440],
      },
    });
  });
});
