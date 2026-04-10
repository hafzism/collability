"use client";

import {
  Bell,
  Clock3,
  Filter,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardTopbarProps = {
  boardName: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function DashboardTopbar({
  boardName,
  isSidebarOpen,
  onToggleSidebar,
}: DashboardTopbarProps) {
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
      </div>

      <div className="flex flex-1 items-center justify-center px-2">
        <div className="flex w-full max-w-[420px] items-center gap-2">
          <label className="flex h-8 flex-1 items-center gap-2 rounded-[10px] border border-white/6 bg-[#141415] px-3 text-[#8f8f8f]">
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
            className="flex h-8 items-center gap-2 rounded-[10px] border border-white/6 bg-[#141415] px-3 text-[13px] text-[#b3b3b0] transition hover:bg-white/5 hover:text-white"
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
          className="flex h-8 w-[125px] items-center justify-center rounded-[10px] border border-white/6 bg-[#141415] px-3 text-[#d8d8d5] transition hover:bg-white/5"
        >
          <span className="flex -space-x-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#141415] bg-[#d66c12] text-[9px] font-semibold text-white">
              H
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#141415] bg-[#3a5568] text-[9px] font-semibold text-white">
              A
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#141415] bg-[#5a3d76] text-[9px] font-semibold text-white">
              N
            </span>
          </span>
        </button>

        <button
          type="button"
          aria-label="Activity history"
          className="rounded-[10px] border border-white/6 bg-[#141415] p-2 text-[#8a8a8a] transition hover:bg-white/5 hover:text-white"
        >
          <Clock3 className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-[10px] border border-white/6 bg-[#141415] p-2 text-[#8a8a8a] transition hover:bg-white/5 hover:text-white"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
