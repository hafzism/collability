import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service';

type ActivityMetadata = Record<string, unknown>;

type ActivityActor = {
  name: string;
};

type ActivityLogRecord = {
  id: string;
  action: string;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
  user: ActivityActor;
};

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    tx: Prisma.TransactionClient | PrismaService,
    input: {
      workspaceId: string;
      userId: string;
      entityType: string;
      entityId: string;
      action: string;
      metadata?: ActivityMetadata;
    },
  ) {
    await tx.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listWorkspaceActivity(workspaceId: string, limit = 30) {
    return this.prisma.activityLog.findMany({
      where: {
        workspaceId,
        action: {
          in: [
            'workspace.created',
            'workspace.renamed',
            'workspace.member_joined',
            'workspace.member_removed',
            'workspace.member_left',
            'workspace.member_role_changed',
            'board.created',
            'board.archived',
            'board.deleted',
            'board.visibility_changed',
          ],
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  formatWorkspaceActivity(log: ActivityLogRecord) {
    const actorName = log.user.name;
    const metadata = this.getMetadata(log);

    switch (log.action) {
      case 'workspace.created':
        return `${actorName} created the workspace`;
      case 'workspace.renamed':
        return `${actorName} renamed the workspace to ${this.quote(metadata.newName)}`;
      case 'workspace.member_joined':
        return `${this.readName(metadata.targetUserName, actorName)} joined via invite`;
      case 'workspace.member_removed':
        return `${actorName} removed ${this.readName(metadata.targetUserName)} from the workspace`;
      case 'workspace.member_left':
        return `${actorName} left the workspace`;
      case 'workspace.member_role_changed':
        return `${actorName} changed ${this.readName(metadata.targetUserName)} from ${this.lower(metadata.oldRole)} to ${this.lower(metadata.newRole)}`;
      case 'board.created':
        return `${actorName} added board ${this.quote(metadata.boardTitle)}`;
      case 'board.archived':
        return `${actorName} archived board ${this.quote(metadata.boardTitle)}`;
      case 'board.deleted':
        return `${actorName} deleted board ${this.quote(metadata.boardTitle)}`;
      case 'board.visibility_changed':
        return `${actorName} changed ${this.quote(metadata.boardTitle)} visibility from ${this.lower(metadata.oldVisibility)} to ${this.lower(metadata.newVisibility)}`;
      default:
        return `${actorName} updated the workspace`;
    }
  }

  formatBoardActivity(log: ActivityLogRecord) {
    const actorName = log.user.name;
    const metadata = this.getMetadata(log);

    switch (log.action) {
      case 'board.created':
        return `${actorName} created the board`;
      case 'board.renamed':
        return `${actorName} renamed the board to ${this.quote(metadata.newTitle)}`;
      case 'board.description_changed':
        return `${actorName} updated the board description`;
      case 'board.visibility_changed':
        return `${actorName} changed board visibility from ${this.lower(metadata.oldVisibility)} to ${this.lower(metadata.newVisibility)}`;
      case 'board.archived':
        return `${actorName} archived the board`;
      case 'board.deleted':
        return `${actorName} deleted the board`;
      case 'board.member_added':
        return `${actorName} added ${this.readName(metadata.targetUserName)} to the board as ${this.lower(metadata.role)}`;
      case 'board.member_role_changed':
        return `${actorName} changed ${this.readName(metadata.targetUserName)} from ${this.lower(metadata.oldRole)} to ${this.lower(metadata.newRole)}`;
      case 'board.member_removed':
        return `${actorName} removed ${this.readName(metadata.targetUserName)} from the board`;
      case 'board.label_created':
        return `${actorName} created label ${this.quote(metadata.labelName)}`;
      case 'list.created':
        return `${actorName} created list ${this.quote(metadata.listTitle)}`;
      case 'list.renamed':
        return `${actorName} renamed list to ${this.quote(metadata.newTitle)}`;
      case 'list.archived':
        return `${actorName} archived list ${this.quote(metadata.listTitle)}`;
      case 'list.deleted':
        return `${actorName} deleted list ${this.quote(metadata.listTitle)}`;
      case 'card.created':
        return `${actorName} added card ${this.quote(metadata.cardTitle)}`;
      case 'card.archived':
        return `${actorName} archived card ${this.quote(metadata.cardTitle)}`;
      case 'card.deleted':
        return `${actorName} deleted card ${this.quote(metadata.cardTitle)}`;
      case 'card.moved':
        return `${actorName} moved ${this.quote(metadata.cardTitle)} from ${this.quote(metadata.fromListTitle)} to ${this.quote(metadata.toListTitle)}`;
      case 'card.assignee_added':
        return `${actorName} added ${this.readName(metadata.targetUserName)} to ${this.quote(metadata.cardTitle)}`;
      case 'card.assignee_removed':
        return `${actorName} removed ${this.readName(metadata.targetUserName)} from ${this.quote(metadata.cardTitle)}`;
      default:
        return `${actorName} updated the board`;
    }
  }

  formatCardActivity(log: ActivityLogRecord) {
    const actorName = log.user.name;
    const metadata = this.getMetadata(log);

    switch (log.action) {
      case 'card.created':
        return `${actorName} created the card`;
      case 'card.title_changed':
        return `${actorName} renamed the card to ${this.quote(metadata.newTitle)}`;
      case 'card.description_changed':
        return `${actorName} updated the description`;
      case 'card.due_date_added':
        return `${actorName} set the due date to ${this.readString(metadata.newDueDate)}`;
      case 'card.due_date_changed':
        return `${actorName} changed the due date to ${this.readString(metadata.newDueDate)}`;
      case 'card.due_date_removed':
        return `${actorName} removed the due date`;
      case 'card.assignee_added':
        return `${actorName} added ${this.readName(metadata.targetUserName)} to the card`;
      case 'card.assignee_removed':
        return `${actorName} removed ${this.readName(metadata.targetUserName)} from the card`;
      case 'card.label_added':
        return `${actorName} added label ${this.quote(metadata.labelName)}`;
      case 'card.label_removed':
        return `${actorName} removed label ${this.quote(metadata.labelName)}`;
      case 'card.moved':
        return `${actorName} moved the card from ${this.quote(metadata.fromListTitle)} to ${this.quote(metadata.toListTitle)}`;
      case 'card.archived':
        return `${actorName} archived the card`;
      case 'card.deleted':
        return `${actorName} deleted the card`;
      default:
        return `${actorName} updated the card`;
    }
  }

  private getMetadata(log: ActivityLogRecord): ActivityMetadata {
    if (!log.metadata || typeof log.metadata !== 'object' || Array.isArray(log.metadata)) {
      return {};
    }

    return log.metadata as ActivityMetadata;
  }

  private quote(value: unknown) {
    return `"${this.readString(value)}"`;
  }

  private readName(value: unknown, fallback = 'someone') {
    const text = this.readString(value);
    return text || fallback;
  }

  private readString(value: unknown) {
    return typeof value === 'string' ? value : '';
  }

  private lower(value: unknown) {
    return this.readString(value).toLowerCase();
  }
}
