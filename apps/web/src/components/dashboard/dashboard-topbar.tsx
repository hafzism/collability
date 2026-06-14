"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Clock3,
  Filter,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings2,
} from "lucide-react";

import type { BoardPresenceSnapshot } from "@/lib/board-presence";
import { cn } from "@/lib/utils";
import { BoardActivityPopover } from "./board-activity-popover";
import { BoardMembersPopover } from "./board-members-popover";
import { BoardNotificationsPopover } from "./board-notifications-popover";
import type { BoardActivityItem, BoardMember } from "./board-types";
import { getAvatarFallback } from "./workspace-utils";

type DashboardTopbarProps = {
  activityItems: BoardActivityItem[];
  boardName: string;
  boardMembers: BoardMember[];
  boardPresence: BoardPresenceSnapshot | null;
  canManageBoard: boolean;
  currentUserId: string;
  isSidebarOpen: boolean;
  onCreateList: () => void;
  onOpenBoardActivity: () => void;
  onOpenBoardMembers: () => void;
  onOpenBoardSettings: () => void;
  onToggleSidebar: () => void;
};

type OpenPanel = "members" | "activity" | "notifications" | null;

export function DashboardTopbar({
  activityItems,
  boardName,
  boardMembers,
  boardPresence,
  canManageBoard,
  currentUserId,
  isSidebarOpen,
  onCreateList,
  onOpenBoardActivity,
  onOpenBoardMembers,
  onOpenBoardSettings,
  onToggleSidebar,
}: DashboardTopbarProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const actionGroupRef = useRef<HTMLDivElement | null>(null);
  const onlineUserIds = useMemo(
    () => new Set((boardPresence?.users ?? []).map((user) => user.userId)),
    [boardPresence?.users],
  );
  const sortedMembers = useMemo(
    () =>
      [...boardMembers].sort((left, right) => {
        const leftOnline = onlineUserIds.has(left.userId);
        const rightOnline = onlineUserIds.has(right.userId);

        if (leftOnline !== rightOnline) {
          return leftOnline ? -1 : 1;
        }

        return left.user.name.localeCompare(right.user.name);
      }),
    [boardMembers, onlineUserIds],
  );
  const visibleMembers = sortedMembers.slice(0, 3);
  const remainingMembersCount = Math.max(
    boardMembers.length - visibleMembers.length,
    0,
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        actionGroupRef.current &&
        !actionGroupRef.current.contains(event.target as Node)
      ) {
        setOpenPanel(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <header
      className={cn(
        "flex h-13 min-w-0 items-center justify-between gap-4 px-4 py-1 transition-[height,padding] duration-200",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-[#8a8a8a] transition hover:bg-white/5 hover:text-white"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>

        <h1 className="truncate text-[19px] font-semibold tracking-[-0.025em] text-[#f5f5f3]">
          {boardName}
        </h1>

        {canManageBoard ? (
          <button
            type="button"
            aria-label="Board settings"
            onClick={onOpenBoardSettings}
            className="ui-pressed-button rounded-[10px] border p-2 transition"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Board details"
            onClick={onOpenBoardSettings}
            className="ui-pressed-button rounded-[10px] border p-2 transition"
          >
            <Info className="h-4 w-4" />
          </button>
        )}

        {canManageBoard ? (
          <button
            type="button"
            aria-label="Create list"
            onClick={onCreateList}
            className="ui-pressed-button rounded-[10px] border p-2 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 items-center justify-center px-2">
        <div className="flex w-full max-w-[420px] items-center gap-2">
          <label className="ui-pressed-active flex h-8 flex-1 items-center gap-2 rounded-[10px] border px-3 text-[#8f8f8f]">
            <Search className="h-4 w-4 shrink-0" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent text-[13px] text-[#ededeb] outline-none placeholder:text-[#6f6f6f]"
            />
          </label>

          <button
            type="button"
            aria-label="Filter"
            className="ui-pressed-button flex h-8 items-center gap-2 rounded-[10px] border px-3 text-[13px] transition"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div ref={actionGroupRef} className="relative flex items-center gap-2">
        <button
          type="button"
          aria-label="Members"
          onClick={() =>
            setOpenPanel((current) =>
              current === "members" ? null : "members",
            )
          }
          className={cn(
            "ui-pressed-button flex h-8 min-w-[86px] items-center justify-center rounded-[10px] border px-3 transition",
            openPanel === "members"
              ? "border-white/14 bg-white/8 text-white"
              : "",
          )}
        >
          <span className="flex -space-x-1.5">
            {visibleMembers.length > 0 ? (
              visibleMembers.map((member) => (
                <span
                  key={member.id}
                  title={member.user.name}
                  className="relative flex h-5 w-5 items-center justify-center rounded-full border border-[#141415] bg-[#d66c12] text-[9px] font-semibold text-white"
                >
                  {getAvatarFallback(member.user.name)}
                  {onlineUserIds.has(member.userId) ? (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#141415] bg-[#47d681]" />
                  ) : null}
                </span>
              ))
            ) : (
              <span className="px-1 text-[11px] text-[#a5a5a0]">Members</span>
            )}
            {remainingMembersCount > 0 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#141415] bg-[#29292b] text-[9px] font-semibold text-white">
                +{remainingMembersCount}
              </span>
            ) : null}
          </span>
        </button>

        <button
          type="button"
          aria-label="Activity history"
          onClick={() => {
            onOpenBoardActivity();
            setOpenPanel((current) =>
              current === "activity" ? null : "activity",
            );
          }}
          className={cn(
            "ui-pressed-button rounded-[10px] border p-2 transition",
            openPanel === "activity"
              ? "border-white/14 bg-white/8 text-white"
              : "",
          )}
        >
          <Clock3 className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          onClick={() =>
            setOpenPanel((current) =>
              current === "notifications" ? null : "notifications",
            )
          }
          className={cn(
            "ui-pressed-button rounded-[10px] border p-2 transition",
            openPanel === "notifications"
              ? "border-white/14 bg-white/8 text-white"
              : "",
          )}
        >
          <Bell className="h-4 w-4" />
        </button>

        {openPanel === "members" ? (
          <BoardMembersPopover
            boardMembers={boardMembers}
            canManageBoard={canManageBoard}
            currentUserId={currentUserId}
            onManageMembers={() => {
              setOpenPanel(null);
              onOpenBoardMembers();
            }}
            presence={boardPresence}
          />
        ) : null}

        {openPanel === "activity" ? (
          <BoardActivityPopover
            activityItems={activityItems}
            boardName={boardName}
          />
        ) : null}

        {openPanel === "notifications" ? <BoardNotificationsPopover /> : null}
      </div>
    </header>
  );
}
