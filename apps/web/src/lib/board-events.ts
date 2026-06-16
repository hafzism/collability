"use client";

import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "./auth-session";
import type {
  BoardPresenceSnapshot,
  BoardPresenceUpdate,
} from "./board-presence";
import type { BoardNotification } from "@/components/dashboard/board-types";

export type BoardEventType =
  | "board.updated"
  | "board.deleted"
  | "board.label_created"
  | "board.member_added"
  | "board.member_removed"
  | "board.member_role_changed"
  | "list.created"
  | "list.updated"
  | "list.reordered"
  | "list.deleted"
  | "card.created"
  | "card.updated"
  | "card.reordered"
  | "card.moved"
  | "card.deleted"
  | "card.comment_created";

export type BoardRealtimeEvent = {
  boardId: string;
  type: BoardEventType;
  actorUserId: string;
  affectedListIds?: string[];
  cardId?: string;
  entity?: {
    type: "board" | "list" | "card" | "comment" | "label" | "member";
    id: string;
  };
  listId?: string;
  targetListId?: string;
  timestamp: string;
  workspaceId?: string;
};

type ServerToClientEvents = {
  "board:event": (event: BoardRealtimeEvent) => void;
  "board:presence": (snapshot: BoardPresenceSnapshot) => void;
  "notification:created": (notification: BoardNotification) => void;
};

type ClientToServerEvents = {
  "board:join": (input: { boardId: string }) => void;
  "board:leave": (input: { boardId: string }) => void;
  "board:presence:update": (input: BoardPresenceUpdate) => void;
};

export type BoardEventsSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export function createBoardEventsSocket() {
  const token = getAccessToken();
  if (!token) {
    return null;
  }

  return io(`${getApiBaseUrl()}/board-events`, {
    auth: {
      token,
    },
    withCredentials: true,
  }) as BoardEventsSocket;
}
