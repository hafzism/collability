import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import type { BoardEventPayload } from './board-events.types';

export const BOARD_EVENT_NAME = 'board:event';

export function getBoardRoomName(boardId: string) {
  return `board:${boardId}`;
}

@Injectable()
export class BoardEventsService {
  private server: Server | null = null;

  bindServer(server: Server) {
    this.server = server;
  }

  emitBoardEvent(event: BoardEventPayload) {
    if (!this.server) {
      return;
    }

    this.server.to(getBoardRoomName(event.boardId)).emit(BOARD_EVENT_NAME, {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    });
  }
}
