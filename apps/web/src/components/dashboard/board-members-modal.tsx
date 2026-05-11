"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { DashboardModal } from "./dashboard-modal";
import type { BoardDetail, BoardRole } from "./board-types";
import type { WorkspaceMember } from "./workspace-types";
import { getAvatarFallback } from "./workspace-utils";

type BoardMembersModalProps = {
  board: BoardDetail;
  currentUserId: string;
  onAddMember: (input: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }) => Promise<void>;
  onClose: () => void;
  onRemoveMember: (input: { boardId: string; userId: string }) => Promise<void>;
  onUpdateMemberRole: (input: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }) => Promise<void>;
  workspaceMembers: WorkspaceMember[];
};

const BOARD_ROLE_OPTIONS: BoardRole[] = ["MANAGER", "CONTRIBUTOR", "VIEWER"];
const SEARCH_RESULT_LIMIT = 12;

function formatBoardRole(role: BoardRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function rolePillClasses() {
  return "ui-pressed-active inline-flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#d6d6d1] transition";
}

export function BoardMembersModal({
  board,
  currentUserId,
  onAddMember,
  onClose,
  onRemoveMember,
  onUpdateMemberRole,
  workspaceMembers,
}: BoardMembersModalProps) {
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const searchAreaRef = useRef<HTMLDivElement | null>(null);

  const explicitMemberIds = useMemo(
    () => new Set(board.members.map((member) => member.userId)),
    [board.members],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const availableMembers = useMemo(() => {
    const query = debouncedSearch;

    return workspaceMembers
      .filter((member) => member.userId !== currentUserId)
      .filter((member) => !explicitMemberIds.has(member.userId))
      .filter((member) => {
        if (!query) {
          return true;
        }

        return (
          member.user.name.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)
        );
      });
  }, [currentUserId, debouncedSearch, explicitMemberIds, workspaceMembers]);

  const visibleAvailableMembers = useMemo(
    () => availableMembers.slice(0, SEARCH_RESULT_LIMIT),
    [availableMembers],
  );

  const canManage = board.currentUserBoardRole === "MANAGER";

  async function handleAddMember(userId: string) {
    setPendingUserId(userId);
    setActionError(null);

    try {
      await onAddMember({
        boardId: board.id,
        userId,
        role: "VIEWER",
      });
      setSearch("");
      setDebouncedSearch("");
      setIsSearchOpen(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to add member right now.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleRoleChange(userId: string, role: BoardRole) {
    setPendingUserId(userId);
    setActionError(null);

    try {
      await onUpdateMemberRole({
        boardId: board.id,
        userId,
        role,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update member role right now.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  async function handleRemoveMember(userId: string) {
    setPendingUserId(userId);
    setActionError(null);

    try {
      await onRemoveMember({
        boardId: board.id,
        userId,
      });
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to remove member right now.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <DashboardModal
      className="flex h-[min(760px,calc(100vh-48px))] max-w-3xl flex-col"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 pb-5">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
            Board members
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#9a9a95]">
            These are the explicit board members and their roles.
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

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {canManage ? (
          <section
            ref={searchAreaRef}
            className="ui-pressed-active shrink-0 rounded-[14px] border p-4"
          >
            <p className="text-sm font-medium text-[#f0f0ec]">Add members</p>
            <div className="ui-pressed-active mt-4 flex items-center gap-2 rounded-[12px] border px-3">
              <Search className="h-4 w-4 text-[#72726e]" />
              <input
                type="text"
                value={search}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search by name or email"
                className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#676762]"
              />
            </div>
            {isSearchOpen ? (
              <div className="mt-3 max-h-[240px] overflow-y-auto rounded-[12px] border border-white/8 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
                {visibleAvailableMembers.length > 0 ? (
                  <>
                    {visibleAvailableMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d66c12] text-xs font-semibold text-white">
                        {getAvatarFallback(member.user.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#f0f0ec]">
                          {member.user.name}
                        </p>
                        <p className="truncate text-xs text-[#8f8f89]">
                          {member.user.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleAddMember(member.userId)}
                        disabled={pendingUserId === member.userId}
                        className="ui-pressed-button rounded-[10px] border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                    ))}
                    {availableMembers.length > SEARCH_RESULT_LIMIT ? (
                      <div className="border-t border-white/6 px-4 py-2 text-xs text-[#7f7f79]">
                        Showing {SEARCH_RESULT_LIMIT} of {availableMembers.length} matches.
                        Refine your search to narrow the list.
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="px-4 py-8 text-sm text-[#8f8f89]">
                    {debouncedSearch
                      ? "No workspace members match this search."
                      : "Start typing or pick from the first matching workspace members here."}
                  </div>
                )}
              </div>
            ) : null}
          </section>
        ) : null}

        <section className="ui-pressed-active flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border">
          <div className="border-b border-white/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#f0f0ec]">
                Members
              </p>
              <span className="ui-pressed-active rounded-[10px] border px-3 py-1 text-[11px] font-medium text-[#c9c9c4]">
                {board.members.length}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
            {board.members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const canEditRole = canManage && !isCurrentUser;
              const canRemove = canManage && !isCurrentUser;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d66c12] text-xs font-semibold text-white">
                    {getAvatarFallback(member.user.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#f0f0ec]">
                      {member.user.name}
                      {isCurrentUser ? " (You)" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEditRole ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            disabled={pendingUserId === member.userId}
                            className={cn(
                              rolePillClasses(),
                              "outline-none disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                          >
                            <span>{formatBoardRole(member.role)}</span>
                            <ChevronDown className="h-3.5 w-3.5 transition group-data-[state=open]:rotate-180" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {BOARD_ROLE_OPTIONS.map((role) => {
                            const isSelected = member.role === role;

                            return (
                              <DropdownMenuItem
                                key={role}
                                onClick={() =>
                                  void handleRoleChange(member.userId, role)
                                }
                                className={cn(
                                  isSelected
                                    ? "ui-pressed-active"
                                    : "text-[#c3c3be] hover:bg-white/6 hover:text-white",
                                )}
                              >
                                <span>{formatBoardRole(role)}</span>
                                {isSelected ? (
                                  <Check className="ml-auto h-3.5 w-3.5 text-[#d9d9d4]" />
                                ) : null}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className={rolePillClasses()}>
                        {formatBoardRole(member.role)}
                      </span>
                    )}

                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveMember(member.userId)}
                        disabled={pendingUserId === member.userId}
                        className="rounded-[10px] p-2 text-[#8f8f89] transition hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Remove ${member.user.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {actionError ? (
        <p className="mt-4 text-xs text-[#f07f6a]">{actionError}</p>
      ) : null}
    </DashboardModal>
  );
}
