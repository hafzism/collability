import { Injectable } from '@nestjs/common';
import type {
  BoardPresenceSnapshot,
  BoardPresenceSocketUser,
  BoardPresenceStatus,
  BoardPresenceUser,
} from './board-presence.types';

type PresenceRecord = {
  boardId: string;
  socketId: string;
  user: BoardPresenceSocketUser;
  viewingCardId: string | null;
  editingCardId: string | null;
  typingCardId: string | null;
  updatedAt: string;
};

type EnterBoardInput = {
  boardId: string;
  socketId: string;
  user: BoardPresenceSocketUser;
};

type LeaveBoardInput = {
  boardId: string;
  socketId: string;
};

type UpdatePresenceInput = {
  boardId: string;
  socketId: string;
  viewingCardId?: string | null;
  editingCardId?: string | null;
  typingCardId?: string | null;
};

@Injectable()
export class BoardPresenceService {
  private readonly recordsBySocketAndBoard = new Map<string, PresenceRecord>();

  enterBoard(input: EnterBoardInput): BoardPresenceSnapshot {
    const existing = this.recordsBySocketAndBoard.get(
      this.getRecordKey(input.socketId, input.boardId),
    );

    this.recordsBySocketAndBoard.set(
      this.getRecordKey(input.socketId, input.boardId),
      {
        boardId: input.boardId,
        socketId: input.socketId,
        user: input.user,
        viewingCardId: existing?.viewingCardId ?? null,
        editingCardId: existing?.editingCardId ?? null,
        typingCardId: existing?.typingCardId ?? null,
        updatedAt: new Date().toISOString(),
      },
    );

    return this.getBoardSnapshot(input.boardId);
  }

  updatePresence(input: UpdatePresenceInput): BoardPresenceSnapshot {
    const key = this.getRecordKey(input.socketId, input.boardId);
    const existing = this.recordsBySocketAndBoard.get(key);

    if (!existing) {
      return this.getBoardSnapshot(input.boardId);
    }

    this.recordsBySocketAndBoard.set(key, {
      ...existing,
      viewingCardId:
        input.viewingCardId === undefined
          ? existing.viewingCardId
          : input.viewingCardId,
      editingCardId:
        input.editingCardId === undefined
          ? existing.editingCardId
          : input.editingCardId,
      typingCardId:
        input.typingCardId === undefined ? existing.typingCardId : input.typingCardId,
      updatedAt: new Date().toISOString(),
    });

    return this.getBoardSnapshot(input.boardId);
  }

  leaveBoard(input: LeaveBoardInput): BoardPresenceSnapshot {
    this.recordsBySocketAndBoard.delete(
      this.getRecordKey(input.socketId, input.boardId),
    );

    return this.getBoardSnapshot(input.boardId);
  }

  disconnectSocket(socketId: string): BoardPresenceSnapshot[] {
    const affectedBoardIds = new Set<string>();

    for (const record of this.recordsBySocketAndBoard.values()) {
      if (record.socketId === socketId) {
        affectedBoardIds.add(record.boardId);
      }
    }

    for (const boardId of affectedBoardIds) {
      this.recordsBySocketAndBoard.delete(this.getRecordKey(socketId, boardId));
    }

    return Array.from(affectedBoardIds).map((boardId) =>
      this.getBoardSnapshot(boardId),
    );
  }

  getBoardSnapshot(boardId: string): BoardPresenceSnapshot {
    const records = Array.from(this.recordsBySocketAndBoard.values()).filter(
      (record) => record.boardId === boardId,
    );
    const recordsByUserId = new Map<string, PresenceRecord[]>();

    for (const record of records) {
      const userRecords = recordsByUserId.get(record.user.id) ?? [];
      userRecords.push(record);
      recordsByUserId.set(record.user.id, userRecords);
    }

    return {
      boardId,
      users: Array.from(recordsByUserId.values())
        .map((userRecords) => this.aggregateUserRecords(userRecords))
        .sort((left, right) => {
          if (left.status !== right.status) {
            return (
              this.getStatusRank(right.status) - this.getStatusRank(left.status)
            );
          }

          return left.name.localeCompare(right.name);
        }),
    };
  }

  private aggregateUserRecords(records: PresenceRecord[]): BoardPresenceUser {
    const latestRecord = records.reduce((latest, record) =>
      record.updatedAt > latest.updatedAt ? record : latest,
    );
    const editingCardId =
      records.find((record) => record.editingCardId)?.editingCardId ?? null;
    const typingCardId =
      records.find((record) => record.typingCardId)?.typingCardId ?? null;
    const viewingCardId =
      records.find((record) => record.viewingCardId)?.viewingCardId ?? null;

    return {
      userId: latestRecord.user.id,
      email: latestRecord.user.email,
      name: latestRecord.user.name,
      status: this.getAggregateStatus({
        editingCardId,
        typingCardId,
        viewingCardId,
      }),
      viewingCardId,
      editingCardId,
      typingCardId,
      updatedAt: latestRecord.updatedAt,
    };
  }

  private getAggregateStatus(input: {
    viewingCardId: string | null;
    editingCardId: string | null;
    typingCardId: string | null;
  }): BoardPresenceStatus {
    if (input.editingCardId) {
      return 'editing_card';
    }

    if (input.typingCardId) {
      return 'typing_comment';
    }

    if (input.viewingCardId) {
      return 'viewing_card';
    }

    return 'active';
  }

  private getStatusRank(status: BoardPresenceStatus) {
    switch (status) {
      case 'editing_card':
        return 4;
      case 'typing_comment':
        return 3;
      case 'viewing_card':
        return 2;
      case 'active':
        return 1;
    }
  }

  private getRecordKey(socketId: string, boardId: string) {
    return `${socketId}:${boardId}`;
  }
}
