import type {
  BoardNotification,
  BoardNotificationSetting,
} from "@/components/dashboard/board-types";
import { apiRequest } from "./api-client";

export type BoardNotificationUnreadCount = {
  unreadCount: number;
};

export type UpdateBoardNotificationSettingInput = {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  muted?: boolean;
  dueReminderMinutes?: number[];
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

export function getBoardNotificationSetting(boardId: string) {
  return apiRequest<BoardNotificationSetting>(
    `/boards/${boardId}/notifications/settings`,
    {
      method: "GET",
    },
  );
}

export function updateBoardNotificationSetting(
  boardId: string,
  input: UpdateBoardNotificationSettingInput,
) {
  return apiRequest<BoardNotificationSetting>(
    `/boards/${boardId}/notifications/settings`,
    {
      method: "PATCH",
      body: input,
    },
  );
}
