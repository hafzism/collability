import {
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, BoardNotificationType } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';
import { BoardEventsService } from '../realtime/board-events.service';

export const DEFAULT_DUE_REMINDER_MINUTES = [1440];

type NotificationTx = Prisma.TransactionClient | PrismaService;

type BoardNotificationInput = {
  boardId: string;
  userId: string;
  actorUserId?: string;
  type: BoardNotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

type BoardNotificationSettingUpdate = {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  muted?: boolean;
  dueReminderMinutes?: number[];
};

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private reminderInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly boardEventsService: BoardEventsService,
  ) {}

  onModuleInit() {
    if (process.env.NOTIFICATION_REMINDER_WORKER_ENABLED === 'false') {
      return;
    }

    this.reminderInterval = setInterval(() => {
      void this.processDueDateReminders().catch(() => undefined);
    }, 60_000);
  }

  onModuleDestroy() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
  }

  async listBoardNotifications(boardId: string, userId: string, limit = 30) {
    return this.prisma.boardNotification.findMany({
      where: {
        boardId,
        userId,
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
      take: limit,
    });
  }

  async getUnreadBoardNotificationCount(boardId: string, userId: string) {
    const unreadCount = await this.prisma.boardNotification.count({
      where: {
        boardId,
        userId,
        readAt: null,
      },
    });

    return { unreadCount };
  }

  async markBoardNotificationRead(
    boardId: string,
    notificationId: string,
    userId: string,
  ) {
    const notification = await this.prisma.boardNotification.findFirst({
      where: {
        id: notificationId,
        boardId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.boardNotification.update({
      where: {
        id: notificationId,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async markAllBoardNotificationsRead(boardId: string, userId: string) {
    await this.prisma.boardNotification.updateMany({
      where: {
        boardId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return this.getUnreadBoardNotificationCount(boardId, userId);
  }

  async getBoardNotificationSetting(boardId: string, userId: string) {
    const setting = await this.prisma.boardNotificationSetting.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });

    return (
      setting ?? {
        boardId,
        userId,
        inAppEnabled: true,
        emailEnabled: false,
        dueReminderMinutes: DEFAULT_DUE_REMINDER_MINUTES,
        mutedAt: null,
      }
    );
  }

  async updateBoardNotificationSetting(
    boardId: string,
    userId: string,
    update: BoardNotificationSettingUpdate,
  ) {
    const data = this.getSettingUpdateData(update);
    const createData = {
      boardId,
      userId,
      inAppEnabled: update.inAppEnabled ?? true,
      emailEnabled: update.emailEnabled ?? false,
      dueReminderMinutes:
        update.dueReminderMinutes ?? DEFAULT_DUE_REMINDER_MINUTES,
      mutedAt:
        update.muted === undefined ? null : update.muted ? new Date() : null,
    };

    return this.prisma.boardNotificationSetting.upsert({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
      create: createData,
      update: data,
    });
  }

  async createBoardNotification(
    tx: NotificationTx,
    input: BoardNotificationInput,
  ) {
    if (input.actorUserId && input.actorUserId === input.userId) {
      return null;
    }

    const setting = await tx.boardNotificationSetting.findUnique({
      where: {
        boardId_userId: {
          boardId: input.boardId,
          userId: input.userId,
        },
      },
    });

    if (setting && (!setting.inAppEnabled || setting.mutedAt)) {
      return null;
    }

    const notification = await tx.boardNotification.create({
      data: {
        boardId: input.boardId,
        userId: input.userId,
        actorUserId: input.actorUserId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
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
    });

    this.boardEventsService.emitUserNotification(input.userId, notification);

    return notification;
  }

  async cancelCardDueDateReminders(tx: NotificationTx, cardId: string) {
    await tx.dueDateReminder.deleteMany({
      where: {
        cardId,
        status: 'PENDING',
      },
    });
  }

  async replaceCardDueDateReminders(
    tx: NotificationTx,
    input: {
      boardId: string;
      cardId: string;
      dueDate: Date;
      assigneeIds: string[];
    },
  ) {
    await this.cancelCardDueDateReminders(tx, input.cardId);

    if (input.assigneeIds.length === 0) {
      return;
    }

    const settings = await tx.boardNotificationSetting.findMany({
      where: {
        boardId: input.boardId,
        userId: {
          in: input.assigneeIds,
        },
      },
    });
    const settingsByUserId = new Map(
      settings.map((setting) => [setting.userId, setting]),
    );
    const now = new Date();
    const reminderRows = input.assigneeIds.flatMap((userId) => {
      const setting = settingsByUserId.get(userId);

      if (setting && (!setting.inAppEnabled || setting.mutedAt)) {
        return [];
      }

      const reminderMinutes =
        setting?.dueReminderMinutes.length
          ? setting.dueReminderMinutes
          : DEFAULT_DUE_REMINDER_MINUTES;

      return reminderMinutes
        .map((minutes) => ({
          boardId: input.boardId,
          cardId: input.cardId,
          userId,
          dueDate: input.dueDate,
          remindAt: new Date(input.dueDate.getTime() - minutes * 60 * 1000),
        }))
        .filter((row) => row.remindAt >= now);
    });

    if (reminderRows.length === 0) {
      return;
    }

    await tx.dueDateReminder.createMany({
      data: reminderRows,
      skipDuplicates: true,
    });
  }

  async processDueDateReminders(now = new Date(), limit = 25) {
    const reminders = await this.prisma.dueDateReminder.findMany({
      where: {
        status: 'PENDING',
        remindAt: {
          lte: now,
        },
      },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            assignees: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
      orderBy: {
        remindAt: 'asc',
      },
      take: limit,
    });

    for (const reminder of reminders) {
      const cardDueDate = reminder.card.dueDate;
      const isStillAssigned = reminder.card.assignees.some(
        (assignee) => assignee.userId === reminder.userId,
      );
      const isSameDueDate =
        cardDueDate?.getTime() === reminder.dueDate.getTime();

      if (!cardDueDate || !isStillAssigned || !isSameDueDate) {
        await this.prisma.dueDateReminder.update({
          where: {
            id: reminder.id,
          },
          data: {
            status: 'CANCELED',
          },
        });
        continue;
      }

      const claim = await this.prisma.dueDateReminder.updateMany({
        where: {
          id: reminder.id,
          status: 'PENDING',
        },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      if (claim.count === 0) {
        continue;
      }

      const notification = await this.createBoardNotification(this.prisma, {
        boardId: reminder.boardId,
        userId: reminder.userId,
        type: BoardNotificationType.CARD_DUE_REMINDER,
        title: 'Card due soon',
        body: `"${reminder.card.title}" is due soon`,
        entityType: 'card',
        entityId: reminder.cardId,
        metadata: {
          cardId: reminder.cardId,
          cardTitle: reminder.card.title,
          dueDate: reminder.dueDate.toISOString(),
          remindAt: reminder.remindAt.toISOString(),
        },
      });

      if (notification) {
        await this.prisma.dueDateReminder.update({
          where: {
            id: reminder.id,
          },
          data: {
            notificationId: notification.id,
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      }
    }
  }

  private getSettingUpdateData(update: BoardNotificationSettingUpdate) {
    const data: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      dueReminderMinutes?: number[];
      mutedAt?: Date | null;
    } = {};

    if (update.inAppEnabled !== undefined) {
      data.inAppEnabled = update.inAppEnabled;
    }

    if (update.emailEnabled !== undefined) {
      data.emailEnabled = update.emailEnabled;
    }

    if (update.dueReminderMinutes !== undefined) {
      data.dueReminderMinutes = update.dueReminderMinutes;
    }

    if (update.muted !== undefined) {
      data.mutedAt = update.muted ? new Date() : null;
    }

    return data;
  }
}
