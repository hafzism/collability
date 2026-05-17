"use client";

import {
  ChevronsUpDown,
  Info,
  LogOut,
  Plus,
  Settings2,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SiteBrand } from "@/components/shared/site-brand";

import type { BoardSummary } from "./board-types";
import type { WorkspaceSummary } from "./workspace-types";

type DashboardSidebarProps = {
  accountMenuRef: React.RefObject<HTMLDivElement | null>;
  activeBoard: BoardSummary | null;
  activeWorkspace: WorkspaceSummary | null;
  boardItems: BoardSummary[];
  isAccountMenuOpen: boolean;
  isBoardCreationDisabled: boolean;
  isSidebarOpen: boolean;
  isWorkspaceMenuOpen: boolean;
  onAccountMenuToggle: () => void;
  onBoardSelect: (boardId: string) => void;
  onCreateBoard: () => void;
  onCreateWorkspace: () => void;
  onJoinWorkspace: () => void;
  onOpenWorkspaceDetails: (workspaceId: string) => void;
  onWorkspaceMenuToggle: () => void;
  onWorkspaceSelect: (workspaceId: string) => void;
  userInitials: string;
  userName: string;
  workspaceItems: WorkspaceSummary[];
  workspaceMenuRef: React.RefObject<HTMLDivElement | null>;
};

export function DashboardSidebar({
  accountMenuRef,
  activeBoard,
  activeWorkspace,
  boardItems,
  isAccountMenuOpen,
  isBoardCreationDisabled,
  isSidebarOpen,
  isWorkspaceMenuOpen,
  onAccountMenuToggle,
  onBoardSelect,
  onCreateBoard,
  onCreateWorkspace,
  onJoinWorkspace,
  onOpenWorkspaceDetails,
  onWorkspaceMenuToggle,
  onWorkspaceSelect,
  userInitials,
  userName,
  workspaceItems,
  workspaceMenuRef,
}: DashboardSidebarProps) {
  const switchableWorkspaceItems = activeWorkspace
    ? workspaceItems.filter((workspace) => workspace.id !== activeWorkspace.id)
    : workspaceItems;

  return (
    <aside
      className={cn(
        "shrink-0 overflow-hidden bg-black text-[#a1a1a1] transition-[width,border-color] duration-200",
        isSidebarOpen
          ? "w-[244px] border-r border-white/6"
          : "w-0 border-r border-transparent",
      )}
    >
      <div className="flex h-full min-h-0 w-[244px] flex-col">
        <div className="pb-4 pt-5">
          <div className="px-4 pb-4">
            <SiteBrand href="/dashboard" textClassName="text-[#f5f5f3]" />
          </div>

          {workspaceItems.length === 0 ? (
            <div className="space-y-2 px-4">
              <button
                type="button"
                onClick={onCreateWorkspace}
                className="block text-left text-[13px] font-medium text-[#d6d6d3] transition hover:text-white"
              >
                + Create workspace
              </button>
              <button
                type="button"
                onClick={onJoinWorkspace}
                className="block text-left text-[13px] font-medium text-[#9e9e99] transition hover:text-white"
              >
                + Join workspace
              </button>
            </div>
          ) : (
            <div ref={workspaceMenuRef} className="relative">
              <div className="flex w-full items-center border-x-0 border-y border-white/8 bg-[#131313] transition hover:border-white/12 hover:bg-[#171717]">
                <button
                  type="button"
                  aria-expanded={isWorkspaceMenuOpen}
                  onClick={onWorkspaceMenuToggle}
                  className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-2 text-left"
                >
                  <ChevronsUpDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-[#8a8a86] transition-colors",
                      isWorkspaceMenuOpen ? "text-[#f1f1ef]" : "",
                    )}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[#f1f1ef]">
                      {activeWorkspace?.name ?? "Select workspace"}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  aria-label="Open workspace details"
                  onClick={() => {
                    if (activeWorkspace) {
                      onOpenWorkspaceDetails(activeWorkspace.id);
                    }
                  }}
                  className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#8a8a86] transition hover:bg-white/6 hover:text-white"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>

              {isWorkspaceMenuOpen ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 border-x-0 border-y border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]">
                  {switchableWorkspaceItems.length > 0 ? (
                    <div className="space-y-1">
                      {switchableWorkspaceItems.map((workspace) => (
                        <div
                          key={workspace.id}
                          className="group flex w-full items-center justify-between rounded-[10px] text-left text-[13px] text-[#b2b2b2] transition hover:bg-white/6 hover:text-[#ededeb]"
                        >
                          <button
                            type="button"
                            onClick={() => onWorkspaceSelect(workspace.id)}
                            className="min-w-0 flex-1 px-3 py-2.5 text-left"
                          >
                            <span className="truncate">{workspace.name}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenWorkspaceDetails(workspace.id);
                            }}
                            className="mr-2 ml-3 rounded-md p-1 text-[#767676] opacity-0 transition group-hover:opacity-100 hover:bg-white/6 hover:text-white"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      "grid grid-cols-2 gap-1.5",
                      switchableWorkspaceItems.length > 0
                        ? "mt-1 border-t border-white/6 pt-1.5"
                        : "",
                    )}
                  >
                    <button
                      type="button"
                      onClick={onCreateWorkspace}
                      className="ui-pressed-button flex min-w-0 items-center justify-center gap-1.5 rounded-[10px] border px-2.5 py-2.5 text-[12px] font-medium transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create</span>
                    </button>
                    <button
                      type="button"
                      onClick={onJoinWorkspace}
                      className="ui-pressed-button flex min-w-0 items-center justify-center gap-1.5 rounded-[10px] border px-2.5 py-2.5 text-[12px] font-medium transition"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Join</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 pb-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#616161]">
            Boards
          </p>
          <button
            type="button"
            aria-label="Create board"
            disabled={isBoardCreationDisabled}
            onClick={onCreateBoard}
            className="rounded-md p-1.5 text-[#8d8d8d] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {boardItems.length > 0 ? (
            <nav className="space-y-1">
              {boardItems.map((item) => {
                const isActive = item.id === activeBoard?.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onBoardSelect(item.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[10px] border border-transparent px-3 py-2.5 text-left text-[14px] transition",
                      isActive
                        ? "ui-pressed-active font-medium"
                        : "text-[#979797] hover:bg-white/4 hover:text-[#ececea]",
                    )}
                  >
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="px-1 pt-2 text-sm text-[#7d7d79]">
              {activeWorkspace
                ? "No boards yet. Create the first one for this workspace."
                : "Choose a workspace to start creating boards."}
            </div>
          )}
        </div>

        <div
          ref={accountMenuRef}
          className="relative border-t border-white/6 px-3 py-3"
        >
          {isAccountMenuOpen ? (
            <div className="absolute inset-x-3 bottom-[calc(100%+8px)] z-20 rounded-[14px] border border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]">
              <button
                type="button"
                onClick={onAccountMenuToggle}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
              >
                <Settings2 className="h-4 w-4 text-[#7d7d7d]" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={onAccountMenuToggle}
                className="mt-1 flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
              >
                <UserPlus className="h-4 w-4 text-[#7d7d7d]" />
                <span>Invite people</span>
              </button>
              <div className="mt-1 border-t border-white/6 pt-1.5">
                <button
                  type="button"
                  onClick={onAccountMenuToggle}
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
                >
                  <LogOut className="h-4 w-4 text-[#7d7d7d]" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            aria-expanded={isAccountMenuOpen}
            onClick={onAccountMenuToggle}
            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition hover:bg-white/4"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d66c12] text-[11px] font-semibold text-white">
              {userInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-[#ededeb]">
                {userName}
              </span>
              <span className="block truncate text-[12px] text-[#7d7d7d]">
                Free
              </span>
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
