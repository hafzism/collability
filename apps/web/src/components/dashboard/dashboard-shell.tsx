"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { type AuthUser } from "@/lib/auth";
import { getCardPresenceSummary } from "@/lib/board-presence";

import { AccountSettingsModal } from "./account-settings-modal";
import { BoardActivityModal } from "./board-activity-modal";
import { BoardMembersModal } from "./board-members-modal";
import { BoardSettingsModal } from "./board-settings-modal";
import { CardDetailModal } from "./card-detail-modal";
import { CreateBoardModal } from "./create-board-modal";
import { CreateWorkspaceModal } from "./create-workspace-modal";
import { DashboardKanban } from "./dashboard-kanban";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { JoinWorkspaceModal } from "./join-workspace-modal";
import { useDashboardShell } from "./use-dashboard-shell";
import { WorkspaceDetailsModal } from "./workspace-details-modal";

export function DashboardShell({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => Promise<void>;
}) {
  const dashboard = useDashboardShell(user);
  const cardDetailModalState = dashboard.cardDetailModalState;
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleConfirmLogout() {
    setIsLoggingOut(true);

    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
      setIsConfirmingLogout(false);
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-[#f3f3f1]">
      <div className="flex h-full">
        <DashboardSidebar
          accountMenuRef={dashboard.accountMenuRef}
          activeBoard={dashboard.activeBoard}
          activeWorkspace={dashboard.activeWorkspace}
          boardItems={dashboard.activeBoards}
          isAccountMenuOpen={dashboard.isAccountMenuOpen}
          isBoardCreationDisabled={!dashboard.activeWorkspace}
          isSidebarOpen={dashboard.isSidebarOpen}
          isWorkspaceMenuOpen={dashboard.isWorkspaceMenuOpen}
          onAccountMenuToggle={() =>
            dashboard.setIsAccountMenuOpen((currentState) => !currentState)
          }
          onBoardSelect={dashboard.setActiveBoardId}
          onCreateBoard={() => dashboard.setIsCreateBoardModalOpen(true)}
          onCreateWorkspace={() =>
            dashboard.setIsCreateWorkspaceModalOpen(true)
          }
          onJoinWorkspace={() => dashboard.setIsJoinWorkspaceModalOpen(true)}
          onOpenSettings={() => {
            dashboard.setIsAccountMenuOpen(false);
            dashboard.setIsAccountSettingsModalOpen(true);
          }}
          onLogout={() => setIsConfirmingLogout(true)}
          onOpenWorkspaceDetails={(workspaceId) => {
            dashboard.setWorkspaceDetailsWorkspaceId(workspaceId);
            dashboard.setIsWorkspaceMenuOpen(false);
          }}
          onWorkspaceMenuToggle={() =>
            dashboard.setIsWorkspaceMenuOpen((currentState) => !currentState)
          }
          onWorkspaceSelect={(workspaceId) => {
            dashboard.setActiveWorkspaceId(workspaceId);
            dashboard.setIsWorkspaceMenuOpen(false);
          }}
          userInitials={dashboard.userInitials}
          userName={user.name}
          workspaceItems={dashboard.workspaces}
          workspaceMenuRef={dashboard.workspaceMenuRef}
        />

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 bg-[#050505]",
            dashboard.isSidebarOpen ? "p-0" : "p-0",
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#0f0f10] transition-colors duration-200">
            <DashboardTopbar
              activityItems={
                dashboard.activeBoard
                  ? (dashboard.boardActivityById[dashboard.activeBoard.id] ??
                    [])
                  : []
              }
              boardFilters={dashboard.boardCardFilters}
              boardId={dashboard.activeBoard?.id ?? ""}
              boardLabels={dashboard.activeBoardDetail?.labels ?? []}
              boardLists={dashboard.activeBoardLists}
              boardName={dashboard.activeBoard?.title ?? "Boards"}
              boardSearchText={dashboard.boardSearchText}
              boardMembers={dashboard.activeBoardDetail?.members ?? []}
              boardNotifications={dashboard.boardNotifications}
              boardNotificationUnreadCount={
                dashboard.boardNotificationUnreadCount
              }
              boardPresence={dashboard.boardPresence}
              canManageBoard={
                dashboard.activeBoardDetail?.currentUserBoardRole === "MANAGER"
              }
              currentUserId={user.id}
              hasAppliedBoardCardFilters={
                dashboard.hasAppliedBoardCardFilters
              }
              hasActiveBoard={Boolean(dashboard.activeBoard)}
              isSidebarOpen={dashboard.isSidebarOpen}
              onApplyBoardFilters={dashboard.setAppliedBoardCardFilters}
              onBoardSearchChange={dashboard.setBoardSearchText}
              onOpenBoardActivity={() => {
                if (!dashboard.activeBoard) {
                  return;
                }

                void dashboard.refreshBoardActivity(dashboard.activeBoard.id);
              }}
              onOpenBoardMembers={() => {
                dashboard.setIsBoardMembersModalOpen(true);
              }}
              onOpenBoardSettings={() => {
                dashboard.setIsBoardSettingsModalOpen(true);
              }}
              onMarkAllBoardNotificationsRead={
                dashboard.handleMarkAllBoardNotificationsRead
              }
              onMarkBoardNotificationRead={
                dashboard.handleMarkBoardNotificationRead
              }
              onToggleSidebar={() =>
                dashboard.setIsSidebarOpen((currentState) => !currentState)
              }
            />

            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              {dashboard.workspaceErrorMessage ? (
                <div className="border-b border-[#4c1f1a] bg-[#2a120f] px-6 py-3 text-sm text-[#f2cbc3]">
                  {dashboard.workspaceErrorMessage}
                </div>
              ) : null}
              <DashboardKanban
                activeBoardId={dashboard.activeBoard?.id ?? ""}
                boardLabels={dashboard.activeBoardDetail?.labels ?? []}
                boardMembers={dashboard.activeBoardDetail?.members ?? []}
                boardPresence={dashboard.boardPresence}
                canManageCards={
                  dashboard.activeBoardDetail?.currentUserBoardRole ===
                    "MANAGER" ||
                  dashboard.activeBoardDetail?.currentUserBoardRole ===
                    "CONTRIBUTOR"
                }
                canManageLists={
                  dashboard.activeBoardDetail?.currentUserBoardRole ===
                  "MANAGER"
                }
                cardsByListId={dashboard.cardsByListId}
                createListRequestId={dashboard.createListRequestId}
                currentUserId={user.id}
                lists={dashboard.activeBoardLists}
                onDeleteList={dashboard.handleDeleteList}
                onCreateBoardLabel={dashboard.handleCreateBoardLabel}
                onCreateCard={dashboard.handleCreateCard}
                onCreateList={dashboard.handleCreateList}
                onMoveCard={dashboard.handleMoveCard}
                onOpenCardComments={(input) =>
                  void dashboard.handleOpenCardDetail({
                    ...input,
                    initialTab: "comments",
                  })
                }
                onOpenCardDetails={(input) =>
                  void dashboard.handleOpenCardDetail({
                    ...input,
                    initialTab: "details",
                  })
                }
                onReorderList={dashboard.handleReorderList}
                onRenameList={dashboard.handleRenameList}
              />
            </div>
          </div>
        </section>
      </div>

      {dashboard.isCreateWorkspaceModalOpen ? (
        <CreateWorkspaceModal
          onClose={() => dashboard.setIsCreateWorkspaceModalOpen(false)}
          onSubmit={dashboard.handleCreateWorkspace}
        />
      ) : null}

      {dashboard.isCreateBoardModalOpen && dashboard.activeWorkspace ? (
        <CreateBoardModal
          currentUserId={user.id}
          onClose={() => dashboard.setIsCreateBoardModalOpen(false)}
          onCreateBoard={dashboard.handleCreateBoard}
          onSubmitMembers={dashboard.handleSubmitBoardMembers}
          workspaceMembers={
            dashboard.boardCreationWorkspaceDetail?.members ?? []
          }
          workspaceName={dashboard.activeWorkspace.name}
        />
      ) : null}

      {dashboard.isBoardSettingsModalOpen && dashboard.activeBoardDetail ? (
        <BoardSettingsModal
          board={dashboard.activeBoardDetail}
          canManageBoard={
            dashboard.activeBoardDetail.currentUserBoardRole === "MANAGER"
          }
          onClose={() => dashboard.setIsBoardSettingsModalOpen(false)}
          onDeleteBoard={dashboard.handleDeleteBoard}
          onUpdateBoard={dashboard.handleUpdateBoard}
        />
      ) : null}

      {dashboard.isBoardMembersModalOpen &&
      dashboard.activeBoardDetail &&
      dashboard.boardManagementWorkspaceDetail ? (
        <BoardMembersModal
          board={dashboard.activeBoardDetail}
          currentUserId={user.id}
          onAddMember={dashboard.handleAddBoardMember}
          onClose={() => dashboard.setIsBoardMembersModalOpen(false)}
          onRemoveMember={dashboard.handleRemoveBoardMember}
          onUpdateMemberRole={dashboard.handleUpdateBoardMemberRole}
          workspaceMembers={dashboard.boardManagementWorkspaceDetail.members}
        />
      ) : null}

      {dashboard.isBoardActivityModalOpen && dashboard.activeBoard ? (
        <BoardActivityModal
          activityItems={
            dashboard.boardActivityById[dashboard.activeBoard.id] ?? []
          }
          boardName={dashboard.activeBoard.title}
          onClose={() => dashboard.setIsBoardActivityModalOpen(false)}
        />
      ) : null}

      {cardDetailModalState &&
      dashboard.cardDetailsById[cardDetailModalState.cardId] ? (
        <CardDetailModal
          activityItems={
            dashboard.cardActivityById[cardDetailModalState.cardId] ?? []
          }
          boardLabels={dashboard.activeBoardDetail?.labels ?? []}
          boardMembers={dashboard.activeBoardDetail?.members ?? []}
          canDeleteCard={
            dashboard.activeBoardDetail?.currentUserBoardRole === "MANAGER"
          }
          canEditCard={
            dashboard.activeBoardDetail?.currentUserBoardRole === "MANAGER" ||
            dashboard.activeBoardDetail?.currentUserBoardRole === "CONTRIBUTOR"
          }
          card={dashboard.cardDetailsById[cardDetailModalState.cardId]!}
          initialTab={cardDetailModalState.initialTab}
          onDeleteCard={() =>
            dashboard.handleDeleteCard({
              boardId: cardDetailModalState.boardId,
              listId: cardDetailModalState.listId,
              cardId: cardDetailModalState.cardId,
            })
          }
          onClose={() => dashboard.setCardDetailModalState(null)}
          onCreateComment={(input) =>
            dashboard.handleCreateCardComment({
              boardId: cardDetailModalState.boardId,
              listId: cardDetailModalState.listId,
              cardId: input.cardId,
              content: input.content,
            })
          }
          onPresenceChange={dashboard.emitBoardPresenceUpdate}
          onUpdateCard={(input) =>
            dashboard.handleUpdateCard({
              boardId: cardDetailModalState.boardId,
              listId: cardDetailModalState.listId,
              cardId: input.cardId,
              title: input.title,
              description: input.description,
              dueDate: input.dueDate,
              labelIds: input.labelIds,
              assigneeIds: input.assigneeIds,
            })
          }
          presence={getCardPresenceSummary(
            dashboard.boardPresence,
            cardDetailModalState.cardId,
            user.id,
          )}
        />
      ) : null}

      {dashboard.isJoinWorkspaceModalOpen ? (
        <JoinWorkspaceModal
          onClose={() => dashboard.setIsJoinWorkspaceModalOpen(false)}
          onSubmit={dashboard.handleJoinWorkspace}
        />
      ) : null}

      {dashboard.workspaceDetails ? (
        <WorkspaceDetailsModal
          key={dashboard.workspaceDetails.id}
          activityItems={
            dashboard.workspaceActivityById[dashboard.workspaceDetails.id] ?? []
          }
          currentUserId={user.id}
          onClose={() => dashboard.setWorkspaceDetailsWorkspaceId(null)}
          onDeleteWorkspace={dashboard.handleDeleteWorkspace}
          onInviteMember={dashboard.handleInviteWorkspaceMember}
          onLeaveWorkspace={dashboard.handleLeaveWorkspace}
          onRemoveMember={dashboard.handleRemoveWorkspaceMember}
          onUpdateMemberRole={dashboard.handleUpdateWorkspaceMemberRole}
          onUpdateWorkspace={dashboard.handleUpdateWorkspace}
          workspace={dashboard.workspaceDetails}
        />
      ) : null}

      {dashboard.isAccountSettingsModalOpen ? (
        <AccountSettingsModal
          errorMessage={dashboard.accountSessionsErrorMessage}
          isLoading={dashboard.accountSessionsStatus === "pending"}
          onClose={() => dashboard.setIsAccountSettingsModalOpen(false)}
          onLogoutDevice={dashboard.handleLogoutDeviceSession}
          onLogoutOtherDevices={dashboard.handleLogoutOtherDevices}
          sessions={dashboard.accountSessions}
        />
      ) : null}

      {isConfirmingLogout ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4"
          role="dialog"
        >
          <div className="w-full max-w-[340px] rounded-[14px] border border-white/10 bg-[#111112] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            <p className="text-sm font-medium text-white">Log out?</p>
            <p className="mt-2 text-xs leading-5 text-[#a0a09a]">
              Are you sure you want to log out of Collability?
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingLogout(false)}
                disabled={isLoggingOut}
                className="rounded-[10px] border border-white/10 bg-transparent px-3 py-1.5 text-sm text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmLogout()}
                disabled={isLoggingOut}
                className="rounded-[10px] border border-[#8f2e2e] bg-[#b93838] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#c54545] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
