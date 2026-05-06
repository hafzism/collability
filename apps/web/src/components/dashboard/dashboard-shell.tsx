"use client";

import { useEffect, useRef, useState } from "react";

import { getErrorMessage, type AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspace,
  inviteWorkspaceMember,
  joinWorkspace,
  leaveWorkspace,
  listWorkspaces,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from "@/lib/workspaces";

import { CreateWorkspaceModal } from "./create-workspace-modal";
import { DashboardKanban } from "./dashboard-kanban";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { boardItems } from "./dashboard-types";
import { JoinWorkspaceModal } from "./join-workspace-modal";
import { WorkspaceDetailsModal } from "./workspace-details-modal";
import type {
  WorkspaceActivityItem,
  WorkspaceDetail,
  WorkspaceInviteResponse,
  WorkspaceSummary,
} from "./workspace-types";

const initialWorkspaces: WorkspaceSummary[] = [];
const initialWorkspaceActivity: Record<string, WorkspaceActivityItem[]> = {};

export function DashboardShell({ user }: { user: AuthUser }) {
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
  const [isJoinWorkspaceModalOpen, setIsJoinWorkspaceModalOpen] =
    useState(false);
  const [workspaceDetailsWorkspaceId, setWorkspaceDetailsWorkspaceId] =
    useState<string | null>(null);
  const [workspaceDetails, setWorkspaceDetails] =
    useState<WorkspaceDetail | null>(null);
  const [workspaceErrorMessage, setWorkspaceErrorMessage] = useState<
    string | null
  >(null);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const activeBoard =
    boardItems.find((item) => item.id === activeBoardId) ?? boardItems[0];
  const activeWorkspace =
    workspaces.find((item) => item.id === activeWorkspaceId) ?? null;
  const userInitials = user.name.trim().slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaces() {
      try {
        const loadedWorkspaces = await listWorkspaces();
        if (!isMounted) {
          return;
        }

        setWorkspaces(loadedWorkspaces);
        setActiveWorkspaceId((currentActiveWorkspaceId) => {
          if (
            currentActiveWorkspaceId &&
            loadedWorkspaces.some(
              (workspace) => workspace.id === currentActiveWorkspaceId,
            )
          ) {
            return currentActiveWorkspaceId;
          }

          return loadedWorkspaces[0]?.id ?? "";
        });
        setWorkspaceErrorMessage(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkspaceErrorMessage(
          getErrorMessage(error, "Unable to load your workspaces."),
        );
      }
    }

    void loadWorkspaces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceDetails() {
      if (!workspaceDetailsWorkspaceId) {
        setWorkspaceDetails(null);
        return;
      }

      try {
        const detail = await getWorkspace(workspaceDetailsWorkspaceId);
        if (!isMounted) {
          return;
        }

        setWorkspaceDetails(detail);
      } catch {
        if (!isMounted) {
          return;
        }

        setWorkspaceDetails(null);
      }
    }

    void loadWorkspaceDetails();

    return () => {
      isMounted = false;
    };
  }, [workspaceDetailsWorkspaceId]);

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

  async function refreshWorkspaceDetails(workspaceId: string) {
    const refreshedWorkspace = await getWorkspace(workspaceId);
    setWorkspaceDetails(refreshedWorkspace);
  }

  async function handleCreateWorkspace(values: { name: string }) {
    const workspace = await createWorkspace(values);

    setWorkspaces((current) => [...current, workspace]);
    setWorkspaceActivityById((current) => ({
      ...current,
      [workspace.id]: [],
    }));
    setActiveWorkspaceId(workspace.id);
    setIsCreateWorkspaceModalOpen(false);
    setIsWorkspaceMenuOpen(false);
  }

  async function handleJoinWorkspace(values: { code: string }) {
    const workspace = await joinWorkspace(values);

    setWorkspaces((current) => {
      if (current.some((item) => item.id === workspace.id)) {
        return current.map((item) => (item.id === workspace.id ? workspace : item));
      }

      return [...current, workspace];
    });
    setActiveWorkspaceId(workspace.id);
    setIsJoinWorkspaceModalOpen(false);
  }

  async function handleUpdateWorkspace(
    workspaceId: string,
    updates: Pick<WorkspaceSummary, "name">,
  ) {
    const updatedWorkspace = await updateWorkspace(workspaceId, updates);

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === workspaceId
          ? { ...workspace, ...updatedWorkspace }
          : workspace,
      ),
    );

    setWorkspaceDetails((current) =>
      current && current.id === workspaceId
        ? { ...current, ...updatedWorkspace }
        : current,
    );
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    await deleteWorkspace(workspaceId);

    setWorkspaces((current) => {
      const remaining = current.filter(
        (workspace) => workspace.id !== workspaceId,
      );

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
    setWorkspaceDetails(null);
    setIsWorkspaceMenuOpen(false);
  }

  async function handleInviteWorkspaceMember(input: {
    workspaceId: string;
    email: string;
  }): Promise<WorkspaceInviteResponse> {
    return inviteWorkspaceMember(input);
  }

  async function handleUpdateWorkspaceMemberRole(input: {
    workspaceId: string;
    userId: string;
    role: "ADMIN" | "MEMBER" | "GUEST";
  }) {
    await updateWorkspaceMemberRole(input);
    await refreshWorkspaceDetails(input.workspaceId);
  }

  async function handleRemoveWorkspaceMember(input: {
    workspaceId: string;
    userId: string;
  }) {
    await removeWorkspaceMember(input);
    await refreshWorkspaceDetails(input.workspaceId);
  }

  async function handleLeaveWorkspace(workspaceId: string) {
    await leaveWorkspace(workspaceId);

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

    setWorkspaceDetailsWorkspaceId(null);
    setWorkspaceDetails(null);
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
          onJoinWorkspace={() => setIsJoinWorkspaceModalOpen(true)}
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
          userName={user.name}
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
              {workspaceErrorMessage ? (
                <div className="border-b border-[#4c1f1a] bg-[#2a120f] px-6 py-3 text-sm text-[#f2cbc3]">
                  {workspaceErrorMessage}
                </div>
              ) : null}
              <DashboardKanban activeBoardId={activeBoard.id} />
            </div>
          </div>
        </section>
      </div>

      {isCreateWorkspaceModalOpen ? (
        <CreateWorkspaceModal
          onClose={() => setIsCreateWorkspaceModalOpen(false)}
          onSubmit={handleCreateWorkspace}
        />
      ) : null}

      {isJoinWorkspaceModalOpen ? (
        <JoinWorkspaceModal
          onClose={() => setIsJoinWorkspaceModalOpen(false)}
          onSubmit={handleJoinWorkspace}
        />
      ) : null}

      {workspaceDetails ? (
        <WorkspaceDetailsModal
          key={workspaceDetails.id}
          activityItems={
            workspaceActivityById[workspaceDetails.id] ?? []
          }
          currentUserId={user.id}
          onClose={() => setWorkspaceDetailsWorkspaceId(null)}
          onDeleteWorkspace={handleDeleteWorkspace}
          onInviteMember={handleInviteWorkspaceMember}
          onLeaveWorkspace={handleLeaveWorkspace}
          onRemoveMember={handleRemoveWorkspaceMember}
          onUpdateMemberRole={handleUpdateWorkspaceMemberRole}
          onUpdateWorkspace={handleUpdateWorkspace}
          workspace={workspaceDetails}
        />
      ) : null}
    </div>
  );
}
