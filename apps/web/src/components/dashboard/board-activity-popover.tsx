"use client";

import { Clock3 } from "lucide-react";

import type { BoardActivityItem } from "./board-types";
import { DashboardPopoverPanel } from "./dashboard-popover-panel";

type BoardActivityPopoverProps = {
  activityItems: BoardActivityItem[];
  boardName: string;
};

function formatActivityTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function BoardActivityPopover({
  activityItems,
  boardName,
}: BoardActivityPopoverProps) {
  return (
    <DashboardPopoverPanel>
      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-sm font-semibold text-[#f4f4f1]">Activity</p>
        <p className="mt-0.5 truncate text-[11px] text-[#8f8f89]">
          Recent changes on {boardName}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
        {activityItems.length > 0 ? (
          <div className="space-y-2">
            {activityItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-[10px] border border-white/7 bg-white/[0.025] px-3 py-2.5"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/8 bg-black/20 text-[#cfcfca]">
                  <Clock3 className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-5 text-[#e5e5e0]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[10px] text-[#7f7f7a]">
                    {formatActivityTimestamp(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] items-center justify-center text-center">
            <div>
              <p className="text-sm font-medium text-[#f0f0ec]">No activity yet</p>
              <p className="mt-1 text-[12px] text-[#8f8f89]">
                Board updates will appear here.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardPopoverPanel>
  );
}
