"use client";

import { Clock3, X } from "lucide-react";

import { DashboardModal } from "./dashboard-modal";
import type { BoardActivityItem } from "./board-types";

type BoardActivityModalProps = {
  activityItems: BoardActivityItem[];
  boardName: string;
  onClose: () => void;
};

function formatActivityTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function BoardActivityModal({
  activityItems,
  boardName,
  onClose,
}: BoardActivityModalProps) {
  return (
    <DashboardModal className="flex h-[min(720px,calc(100vh-48px))] max-w-2xl flex-col" onClose={onClose}>
      <div className="flex items-start justify-between gap-4 pb-5">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
            Board activity
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#9a9a95]">
            Recent changes for {boardName}.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-[12px] p-2 text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
        {activityItems.length > 0 ? (
          <div className="space-y-3">
            {activityItems.map((item) => (
              <div
                key={item.id}
                className="ui-pressed-active flex items-start gap-3 rounded-[14px] border px-4 py-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[#d5d5d0]">
                  <Clock3 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#ededeb]">{item.label}</p>
                  <p className="mt-1 text-xs text-[#8f8f89]">
                    {formatActivityTimestamp(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center">
            <div className="text-center">
              <p className="text-[18px] font-semibold text-[#f5f5f3]">
                No board activity yet
              </p>
              <p className="mt-2 text-sm text-[#8f8f89]">
                Board updates, member changes, and archive events will appear
                here.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardModal>
  );
}
