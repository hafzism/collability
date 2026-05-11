"use client";

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

import { cn } from "@/lib/utils";
import type { BoardMember } from "./board-types";
import { getAvatarFallback } from "./workspace-utils";

type DashboardTopbarProps = {
  boardName: string;
  boardMembers: BoardMember[];
  canManageBoard: boolean;
  isSidebarOpen: boolean;
  onCreateList: () => void;
  onOpenBoardActivity: () => void;
  onOpenBoardMembers: () => void;
  onOpenBoardSettings: () => void;
  onToggleSidebar: () => void;
};

export function DashboardTopbar({
  boardName,
  boardMembers,
  canManageBoard,
  isSidebarOpen,
  onCreateList,
  onOpenBoardActivity,
  onOpenBoardMembers,
  onOpenBoardSettings,
  onToggleSidebar,
}: DashboardTopbarProps) {
  const visibleMembers = boardMembers.slice(0, 3);
  const remainingMembersCount = Math.max(boardMembers.length - visibleMembers.length, 0);

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

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Members"
          onClick={onOpenBoardMembers}
          className="ui-pressed-button flex h-8 min-w-[86px] items-center justify-center rounded-[10px] border px-3 transition"
        >
          <span className="flex -space-x-1.5">
            {visibleMembers.length > 0 ? (
              visibleMembers.map((member) => (
                <span
                  key={member.id}
                  title={member.user.name}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-[#141415] bg-[#d66c12] text-[9px] font-semibold text-white"
                >
                  {getAvatarFallback(member.user.name)}
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
          onClick={onOpenBoardActivity}
          className="ui-pressed-button rounded-[10px] border p-2 transition"
        >
          <Clock3 className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="ui-pressed-button rounded-[10px] border p-2 transition"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
