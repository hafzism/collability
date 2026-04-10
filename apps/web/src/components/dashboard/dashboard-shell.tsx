"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { CreateWorkspaceModal } from "./create-workspace-modal";
import { DashboardKanban } from "./dashboard-kanban";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { boardItems } from "./dashboard-types";
import { WorkspaceDetailsModal } from "./workspace-details-modal";
import type {
  WorkspaceActivityItem,
  WorkspaceSummary,
} from "./workspace-types";

const initialWorkspaces: WorkspaceSummary[] = [];
const initialWorkspaceActivity: Record<string, WorkspaceActivityItem[]> = {};

export function DashboardShell({ userName }: { userName: string }) {
  const [activeBoardId, setActiveBoardId] = useState(boardItems[0]?.id ?? "");
  const [workspaces, setWorkspaces] =
    useState<WorkspaceSummary[]>(initialWorkspaces);
  const [workspaceActivityById, setWorkspaceActivityById] = useState<
    Record<string, WorkspaceActivityItem[]>
  >(initialWorkspaceActivity);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    initialWorkspaces[0]?.id ?? "",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] =
    useState(false);
  const [workspaceDetailsWorkspaceId, setWorkspaceDetailsWorkspaceId] =
    useState<string | null>(null);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const activeBoard =
    boardItems.find((item) => item.id === activeBoardId) ?? boardItems[0];
  const activeWorkspace =
    workspaces.find((item) => item.id === activeWorkspaceId) ?? null;
  const workspaceDetailsWorkspace =
    workspaces.find((item) => item.id === workspaceDetailsWorkspaceId) ?? null;
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

  function handleCreateWorkspace(workspace: WorkspaceSummary) {
    setWorkspaces((current) => [...current, workspace]);
    setWorkspaceActivityById((current) => ({
      ...current,
      [workspace.id]: [],
    }));
    setActiveWorkspaceId(workspace.id);
    setIsCreateWorkspaceModalOpen(false);
    setIsWorkspaceMenuOpen(false);
  }

  function handleUpdateWorkspace(
    workspaceId: string,
    updates: Pick<WorkspaceSummary, "name" | "slug" | "updatedAt">,
  ) {
    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, ...updates } : workspace,
      ),
    );
  }

  function handleDeleteWorkspace(workspaceId: string) {
    setWorkspaces((current) => {
      const remaining = current.filter((workspace) => workspace.id !== workspaceId);

      setActiveWorkspaceId((previous) => {
        if (previous !== workspaceId) {
          return previous;
        }

        return remaining[0]?.id ?? "";
      });

      return remaining;
    });

    setWorkspaceActivityById((current) => {
      const next = { ...current };
      delete next[workspaceId];
      return next;
    });

    setWorkspaceDetailsWorkspaceId(null);
    setIsWorkspaceMenuOpen(false);
  }

  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-[#f3f3f1]">
      <div className="flex h-full">
        <DashboardSidebar
          accountMenuRef={accountMenuRef}
          activeBoard={activeBoard}
          activeWorkspace={activeWorkspace}
          boardItems={boardItems}
          isAccountMenuOpen={isAccountMenuOpen}
          isSidebarOpen={isSidebarOpen}
          isWorkspaceMenuOpen={isWorkspaceMenuOpen}
          onAccountMenuToggle={() =>
            setIsAccountMenuOpen((currentState) => !currentState)
          }
          onBoardSelect={setActiveBoardId}
          onCreateWorkspace={() => setIsCreateWorkspaceModalOpen(true)}
          onOpenWorkspaceDetails={(workspaceId) => {
            setWorkspaceDetailsWorkspaceId(workspaceId);
            setIsWorkspaceMenuOpen(false);
          }}
          onWorkspaceMenuToggle={() =>
            setIsWorkspaceMenuOpen((currentState) => !currentState)
          }
          onWorkspaceSelect={(workspaceId) => {
            setActiveWorkspaceId(workspaceId);
            setIsWorkspaceMenuOpen(false);
          }}
          userInitials={userInitials}
          userName={userName}
          workspaceItems={workspaces}
          workspaceMenuRef={workspaceMenuRef}
        />

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 bg-[#050505]",
            isSidebarOpen ? "p-0" : "p-0",
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0f0f10] transition-colors duration-200">
            <DashboardTopbar
              boardName={activeBoard.name}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() =>
                setIsSidebarOpen((currentState) => !currentState)
              }
            />

            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <DashboardKanban activeBoardId={activeBoard.id} />
            </div>
          </div>
        </section>
      </div>

      {isCreateWorkspaceModalOpen ? (
        <CreateWorkspaceModal
          createdBy={userName}
          onClose={() => setIsCreateWorkspaceModalOpen(false)}
          onSubmit={handleCreateWorkspace}
        />
      ) : null}

      {workspaceDetailsWorkspace ? (
        <WorkspaceDetailsModal
          key={workspaceDetailsWorkspace.id}
          activityItems={
            workspaceActivityById[workspaceDetailsWorkspace.id] ?? []
          }
          onClose={() => setWorkspaceDetailsWorkspaceId(null)}
          onDeleteWorkspace={handleDeleteWorkspace}
          onUpdateWorkspace={handleUpdateWorkspace}
          workspace={workspaceDetailsWorkspace}
        />
      ) : null}
    </div>
  );
}
