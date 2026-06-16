import type { BoardNotification } from "@/components/dashboard/board-types";
import { apiRequest } from "./api-client";

export type BoardNotificationUnreadCount = {
  unreadCount: number;
};

export function listBoardNotifications(boardId: string) {
  return apiRequest<BoardNotification[]>(
    `/boards/${boardId}/notifications`,
    {
      method: "GET",
    },
  );
}

export function getBoardNotificationUnreadCount(boardId: string) {
  return apiRequest<BoardNotificationUnreadCount>(
    `/boards/${boardId}/notifications/unread-count`,
    {
      method: "GET",
    },
  );
}

export function markBoardNotificationRead(input: {
  boardId: string;
  notificationId: string;
}) {
  return apiRequest<BoardNotification>(
    `/boards/${input.boardId}/notifications/${input.notificationId}/read`,
    {
      method: "PATCH",
    },
  );
}

export function markAllBoardNotificationsRead(boardId: string) {
  return apiRequest<BoardNotificationUnreadCount>(
    `/boards/${boardId}/notifications/read-all`,
    {
      method: "PATCH",
    },
  );
}
