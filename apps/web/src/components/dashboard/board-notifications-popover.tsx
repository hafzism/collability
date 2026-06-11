"use client";

import { Bell, CheckCheck } from "lucide-react";

import { DashboardPopoverPanel } from "./dashboard-popover-panel";

export function BoardNotificationsPopover() {
  return (
    <DashboardPopoverPanel>
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#f4f4f1]">Notifications</p>
          <p className="mt-0.5 text-[11px] text-[#8f8f89]">
            Assignment, mentions, and reminders later
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-white/8 px-2 py-1 text-[10px] text-[#777771] disabled:cursor-not-allowed"
        >
          <CheckCheck className="h-3 w-3" />
          Mark all read
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
        <div>
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[#d2d2cd]">
            <Bell className="h-4 w-4" />
          </span>
          <p className="mt-3 text-sm font-medium text-[#f0f0ec]">
            Notification system pending
          </p>
          <p className="mt-1 text-[12px] leading-5 text-[#8f8f89]">
            This panel is ready for the future notifications milestone.
          </p>
        </div>
      </div>
    </DashboardPopoverPanel>
  );
}
