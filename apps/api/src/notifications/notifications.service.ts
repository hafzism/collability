import { Injectable, NotFoundException } from '@nestjs/common';
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
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardEventsService: BoardEventsService,
  ) {}

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
