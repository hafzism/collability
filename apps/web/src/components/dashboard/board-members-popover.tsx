"use client";

import { UserPlus } from "lucide-react";

import type { BoardPresenceSnapshot, BoardPresenceUser } from "@/lib/board-presence";

import type { BoardMember } from "./board-types";
import { DashboardPopoverPanel } from "./dashboard-popover-panel";
import { getAvatarFallback } from "./workspace-utils";

type BoardMembersPopoverProps = {
  boardMembers: BoardMember[];
  currentUserId: string;
  presence: BoardPresenceSnapshot | null;
  canManageBoard: boolean;
  onManageMembers: () => void;
};

function getStatusLabel(presenceUser: BoardPresenceUser | undefined) {
  if (!presenceUser) {
    return "Offline";
  }

  switch (presenceUser.status) {
    case "editing_card":
      return "Editing";
    case "typing_comment":
      return "Typing";
    case "viewing_card":
      return "Viewing";
    case "active":
      return "Active";
  }
}

export function BoardMembersPopover({
  boardMembers,
  currentUserId,
  presence,
  canManageBoard,
  onManageMembers,
}: BoardMembersPopoverProps) {
  const presenceByUserId = new Map(
    (presence?.users ?? []).map((presenceUser) => [
      presenceUser.userId,
      presenceUser,
    ]),
  );
  const sortedMembers = [...boardMembers].sort((left, right) => {
    const leftPresence = presenceByUserId.get(left.userId);
    const rightPresence = presenceByUserId.get(right.userId);

    if (Boolean(leftPresence) !== Boolean(rightPresence)) {
      return leftPresence ? -1 : 1;
    }

    return left.user.name.localeCompare(right.user.name);
  });
  const onlineCount = sortedMembers.filter((member) =>
    presenceByUserId.has(member.userId),
  ).length;

  return (
    <DashboardPopoverPanel>
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#f4f4f1]">Board members</p>
          <p className="mt-0.5 text-[11px] text-[#8f8f89]">
            {onlineCount} online of {boardMembers.length}
          </p>
        </div>
        <span className="rounded-full border border-[#2f6d4d] bg-[#143624] px-2 py-0.5 text-[10px] font-medium text-[#7fe3a0]">
          Live
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
        {sortedMembers.map((member) => {
          const presenceUser = presenceByUserId.get(member.userId);
          const isOnline = Boolean(presenceUser);
          const isCurrentUser = member.userId === currentUserId;

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
            >
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d66c12] text-[11px] font-semibold text-white">
                  {getAvatarFallback(member.user.name)}
                </div>
                <span
                  className={
                    isOnline
                      ? "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#141415] bg-[#47d681]"
                      : "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#141415] bg-[#4c4c4d]"
                  }
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#eeeeeb]">
                  {member.user.name}
                  {isCurrentUser ? " (You)" : ""}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#85857f]">
                  {member.user.email}
                </p>
              </div>

              <span
                className={
                  isOnline
                    ? "rounded-full border border-[#2f6d4d] bg-[#143624] px-2 py-0.5 text-[10px] text-[#7fe3a0]"
                    : "rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] text-[#85857f]"
                }
              >
                {getStatusLabel(presenceUser)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/8 p-3">
        <button
          type="button"
          onClick={onManageMembers}
          className="ui-pressed-button flex w-full items-center justify-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-medium transition"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {canManageBoard ? "Add or manage members" : "View members"}
        </button>
      </div>
    </DashboardPopoverPanel>
  );
}
