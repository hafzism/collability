"use client";

import {
  Bell,
  CalendarClock,
  CheckCheck,
  Circle,
  MessageSquareText,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { BoardNotification } from "./board-types";
import { DashboardPopoverPanel } from "./dashboard-popover-panel";

type BoardNotificationsPopoverProps = {
  boardId: string;
  notifications: BoardNotification[];
  unreadCount: number;
  onMarkAllRead: (boardId: string) => Promise<void>;
  onMarkRead: (input: {
    boardId: string;
    notificationId: string;
  }) => Promise<void>;
};

function formatNotificationTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function getNotificationIcon(notification: BoardNotification) {
  if (notification.type === "CARD_DUE_REMINDER") {
    return CalendarClock;
  }

  if (notification.type === "CARD_COMMENTED") {
    return MessageSquareText;
  }

  if (
    notification.type === "BOARD_MEMBER_ADDED" ||
    notification.type === "BOARD_ROLE_CHANGED" ||
    notification.type === "CARD_ASSIGNED" ||
    notification.type === "CARD_UNASSIGNED"
  ) {
    return UserPlus;
  }

  return Bell;
}

export function BoardNotificationsPopover({
  boardId,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
}: BoardNotificationsPopoverProps) {
  return (
    <DashboardPopoverPanel>
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#f4f4f1]">
              Notifications
            </p>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-[#f2f2ee] px-1.5 py-0.5 text-[9px] font-semibold text-[#111112]">
                {unreadCount} new
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] text-[#8f8f89]">
            Board alerts, assignments, comments, and reminders
          </p>
        </div>
        <button
          type="button"
          disabled={unreadCount === 0}
          onClick={() => void onMarkAllRead(boardId)}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/8 px-2 py-1 text-[10px] text-[#d7d7d2] transition hover:border-white/14 hover:bg-white/6 disabled:cursor-not-allowed disabled:text-[#777771]"
        >
          <CheckCheck className="h-3 w-3" />
          Mark all
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {notifications.length > 0 ? (
          <div className="space-y-1">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification);
              const isUnread = !notification.readAt;

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (isUnread) {
                      void onMarkRead({
                        boardId,
                        notificationId: notification.id,
                      });
                    }
                  }}
                  className={cn(
                    "flex w-full gap-3 rounded-[10px] px-2 py-2 text-left transition",
                    isUnread
                      ? "bg-white/[0.055] text-[#f4f4f1]"
                      : "text-[#b8b8b2] hover:bg-white/[0.04]",
                  )}
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-[#e6e6e1]">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-[12px] font-semibold">
                        {notification.title}
                      </span>
                      {isUnread ? (
                        <Circle className="mt-1 h-2 w-2 shrink-0 fill-[#f4f4f1] text-[#f4f4f1]" />
                      ) : null}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-[#9c9c96]">
                      {notification.body}
                    </span>
                    <span className="mt-1.5 block text-[10px] text-[#74746e]">
                      {formatNotificationTimestamp(notification.createdAt)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[210px] items-center justify-center px-6 text-center">
            <div>
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[#d2d2cd]">
                <Bell className="h-4 w-4" />
              </span>
              <p className="mt-3 text-sm font-medium text-[#f0f0ec]">
                No notifications yet
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#8f8f89]">
                Important board updates will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardPopoverPanel>
  );
}
