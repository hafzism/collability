"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  Info,
  LogOut,
  Menu,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Settings2,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";

type BoardItem = {
  id: string;
  name: string;
};

type WorkspaceItem = {
  id: string;
  name: string;
};

const boardItems: BoardItem[] = [
  { id: "projects", name: "Projects" },
  { id: "planning", name: "Planning" },
  { id: "product-design", name: "Product Design" },
];

const workspaceItems: WorkspaceItem[] = [
  { id: "collability", name: "Collability" },
  { id: "studio-labs", name: "Studio Labs" },
  { id: "product-ops", name: "Product Ops" },
];

export function DashboardShell({ userName }: { userName: string }) {
  const [activeBoardId, setActiveBoardId] = useState(boardItems[0]?.id ?? "");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    workspaceItems[0]?.id ?? "",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const activeBoard =
    boardItems.find((item) => item.id === activeBoardId) ?? boardItems[0];
  const activeWorkspace =
    workspaceItems.find((item) => item.id === activeWorkspaceId) ??
    workspaceItems[0] ?? {
      id: "workspace",
      name: userName,
    };
  const userInitials = userName.trim().slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        isWorkspaceMenuOpen &&
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(target)
      ) {
        setIsWorkspaceMenuOpen(false);
      }

      if (
        isAccountMenuOpen &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isAccountMenuOpen, isWorkspaceMenuOpen]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f3f1]">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "overflow-hidden bg-black text-[#a1a1a1] transition-[width,border-color] duration-200",
            isSidebarOpen
              ? "w-[244px] border-r border-white/6"
              : "w-0 border-r border-transparent",
          )}
        >
          <div className="flex h-full min-h-screen w-[244px] flex-col">
            <div className="px-4 pb-4 pt-5">
              <div
                ref={workspaceMenuRef}
                className="relative flex items-center gap-1.5"
              >
                <button
                  type="button"
                  aria-label="Hide sidebar"
                  onClick={() => setIsSidebarOpen(false)}
                  className="shrink-0 rounded-md p-1.5 text-[#8d8d8d] transition hover:bg-white/5 hover:text-white"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    aria-expanded={isWorkspaceMenuOpen}
                    onClick={() =>
                      setIsWorkspaceMenuOpen((currentState) => !currentState)
                    }
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition hover:bg-white/5"
                  >
                    <span className="truncate text-[14px] font-medium text-[#e8e8e6]">
                      {activeWorkspace.name}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-[#7c7c7c] transition-transform",
                        isWorkspaceMenuOpen ? "rotate-180" : "",
                      )}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  aria-label="Workspace settings"
                  className="shrink-0 rounded-md p-1.5 text-[#8d8d8d] transition hover:bg-white/5 hover:text-white"
                >
                  <Settings2 className="h-4 w-4" />
                </button>

                {isWorkspaceMenuOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-[14px] border border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]">
                    <div className="space-y-1">
                      {[
                        activeWorkspace,
                        ...workspaceItems.filter(
                          (workspace) => workspace.id !== activeWorkspace.id,
                        ),
                      ].map((workspace, index) => (
                        <button
                          key={workspace.id}
                          type="button"
                          onClick={() => {
                            setActiveWorkspaceId(workspace.id);
                            setIsWorkspaceMenuOpen(false);
                          }}
                          className={cn(
                            "group flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[13px] transition",
                            index === 0
                              ? "bg-white/8 text-white"
                              : "text-[#b2b2b2] hover:bg-white/6 hover:text-[#ededeb]",
                          )}
                        >
                          <span className="truncate">{workspace.name}</span>
                          <span className="ml-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <Info className="h-3.5 w-3.5 text-[#767676]" />
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-1 border-t border-white/6 pt-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setIsWorkspaceMenuOpen((currentState) => !currentState)
                        }
                        className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#b2b2b2] transition hover:bg-white/6 hover:text-[#ededeb]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create workspace</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between px-4 pb-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#616161]">
                Boards
              </p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-[12px] font-medium text-[#8d8d8d] transition hover:bg-white/5 hover:text-white"
              >
                Create board
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              <nav className="space-y-1">
                {boardItems.map((item) => {
                  const isActive = item.id === activeBoard.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveBoardId(item.id)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[14px] transition",
                        isActive
                          ? "bg-white/8 text-white"
                          : "text-[#979797] hover:bg-white/4 hover:text-[#ececea]",
                      )}
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="ml-3 opacity-0 transition-opacity group-hover:opacity-100">
                        <Pencil className="h-3.5 w-3.5 text-[#767676]" />
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div
              ref={accountMenuRef}
              className="relative border-t border-white/6 px-3 py-3"
            >
              {isAccountMenuOpen ? (
                <div className="absolute inset-x-3 bottom-[calc(100%+8px)] z-20 rounded-[14px] border border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]">
                  <button
                    type="button"
                    onClick={() =>
                      setIsAccountMenuOpen((currentState) => !currentState)
                    }
                    className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
                  >
                    <Settings2 className="h-4 w-4 text-[#7d7d7d]" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setIsAccountMenuOpen((currentState) => !currentState)
                    }
                    className="mt-1 flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
                  >
                    <UserPlus className="h-4 w-4 text-[#7d7d7d]" />
                    <span>Invite people</span>
                  </button>
                  <div className="mt-1 border-t border-white/6 pt-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setIsAccountMenuOpen((currentState) => !currentState)
                      }
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
                onClick={() =>
                  setIsAccountMenuOpen((currentState) => !currentState)
                }
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

        <section
          className={cn(
            "flex min-h-screen flex-1 bg-[#050505] transition-[padding] duration-200",
            isSidebarOpen ? "p-3" : "p-2",
          )}
        >
          <div className="flex min-h-full flex-1 flex-col overflow-hidden rounded-[18px] border border-white/6 bg-[#0f0f10] shadow-[0_0_0_1px_rgba(255,255,255,0.015)] transition-[border-radius,border-color] duration-200">
            <header
              className={cn(
                "flex items-center justify-between gap-4 border-b border-white/6 px-4 transition-[height,padding] duration-200",
                isSidebarOpen ? "h-13 py-1" : "h-12 py-1",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                {!isSidebarOpen ? (
                  <button
                    type="button"
                    aria-label="Show sidebar"
                    onClick={() => setIsSidebarOpen(true)}
                    className="rounded-md p-1.5 text-[#8a8a8a] transition hover:bg-white/5 hover:text-white"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                ) : null}

                {!isSidebarOpen ? (
                  <ChevronRight className="h-4 w-4 text-[#6f6f6f]" />
                ) : null}

                <h1 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-[#f5f5f3]">
                  {activeBoard.name}
                </h1>

                <button
                  type="button"
                  aria-label="Edit board"
                  className="rounded-md p-1.5 text-[#7d7d7d] transition hover:bg-white/5 hover:text-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
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

            <div className="flex-1" />
          </div>
        </section>
      </div>
    </div>
  );
}
