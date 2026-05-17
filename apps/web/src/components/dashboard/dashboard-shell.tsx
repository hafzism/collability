"use client";

import { useEffect, useRef, useState } from "react";

import { getErrorMessage, type AuthUser } from "@/lib/auth";
import {
  addBoardMember,
  createBoard,
  createBoardLabel,
  getBoard,
  getBoardActivity,
  listWorkspaceBoards,
  removeBoardMember,
  updateBoard as updateBoardRequest,
  updateBoardMemberRole as updateBoardMemberRoleRequest,
} from "@/lib/boards";
import {
  createCard,
  createCardComment,
  deleteCard as deleteCardRequest,
  getCardActivity,
  getCardDetail,
  listCards,
  reorderCard,
  updateCard as updateCardRequest,
} from "@/lib/cards";
import {
  createList,
  deleteList,
  listBoardLists,
  updateList,
} from "@/lib/lists";
import { cn } from "@/lib/utils";
import {
  deleteWorkspace,
  getWorkspace,
  getWorkspaceActivity,
  inviteWorkspaceMember,
  joinWorkspace,
  leaveWorkspace,
  listWorkspaces,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
  createWorkspace,
} from "@/lib/workspaces";

import type {
  BoardActivityItem,
  BoardCardActivityItem,
  BoardCardDetail,
  BoardCard,
  BoardDetail,
  BoardList,
  BoardRole,
  BoardSummary,
  BoardVisibility,
} from "./board-types";
import { BoardActivityModal } from "./board-activity-modal";
import { BoardMembersModal } from "./board-members-modal";
import { BoardSettingsModal } from "./board-settings-modal";
import { CreateBoardModal } from "./create-board-modal";
import { CreateWorkspaceModal } from "./create-workspace-modal";
import { DashboardKanban } from "./dashboard-kanban";
import { CardDetailModal } from "./card-detail-modal";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
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
  const [boardActivityById, setBoardActivityById] = useState<
    Record<string, BoardActivityItem[]>
  >({});
  const [boardDetailsById, setBoardDetailsById] = useState<
    Record<string, BoardDetail>
  >({});
  const [cardsByListId, setCardsByListId] = useState<Record<string, BoardCard[]>>(
    {},
  );
  const [cardActivityById, setCardActivityById] = useState<
    Record<string, BoardCardActivityItem[]>
  >({});
  const [cardDetailsById, setCardDetailsById] = useState<
    Record<string, BoardCardDetail>
  >({});
  const [boardListsById, setBoardListsById] = useState<Record<string, BoardList[]>>(
    {},
  );
  const [boardsByWorkspaceId, setBoardsByWorkspaceId] = useState<
    Record<string, BoardSummary[]>
  >({});
  const [createListRequestId, setCreateListRequestId] = useState(0);
  const [activeBoardId, setActiveBoardId] = useState("");
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
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isBoardActivityModalOpen, setIsBoardActivityModalOpen] = useState(false);
  const [isBoardMembersModalOpen, setIsBoardMembersModalOpen] = useState(false);
  const [isBoardSettingsModalOpen, setIsBoardSettingsModalOpen] = useState(false);
  const [cardDetailModalState, setCardDetailModalState] = useState<{
    boardId: string;
    listId: string;
    cardId: string;
    initialTab: "details" | "comments";
  } | null>(null);
  const [isJoinWorkspaceModalOpen, setIsJoinWorkspaceModalOpen] =
    useState(false);
  const [workspaceDetailsWorkspaceId, setWorkspaceDetailsWorkspaceId] =
    useState<string | null>(null);
  const [workspaceDetails, setWorkspaceDetails] =
    useState<WorkspaceDetail | null>(null);
  const [boardCreationWorkspaceDetail, setBoardCreationWorkspaceDetail] =
    useState<WorkspaceDetail | null>(null);
  const [boardManagementWorkspaceDetail, setBoardManagementWorkspaceDetail] =
    useState<WorkspaceDetail | null>(null);
  const [workspaceErrorMessage, setWorkspaceErrorMessage] = useState<
    string | null
  >(null);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const activeWorkspace =
    workspaces.find((item) => item.id === activeWorkspaceId) ?? null;
  const activeBoards = activeWorkspaceId
    ? boardsByWorkspaceId[activeWorkspaceId] ?? []
    : [];
  const activeBoard =
    activeBoards.find((item) => item.id === activeBoardId) ?? activeBoards[0] ?? null;
  const activeBoardDetail = activeBoard ? boardDetailsById[activeBoard.id] ?? null : null;
  const activeBoardLists = activeBoard ? boardListsById[activeBoard.id] ?? [] : [];
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

    async function loadBoards() {
      if (!activeWorkspaceId) {
        setActiveBoardId("");
        return;
      }

      try {
        const boards = await listWorkspaceBoards(activeWorkspaceId);
        if (!isMounted) {
          return;
        }

        setBoardsByWorkspaceId((current) => ({
          ...current,
          [activeWorkspaceId]: boards,
        }));
        setWorkspaceErrorMessage(null);
        setActiveBoardId((currentActiveBoardId) => {
          if (boards.some((board) => board.id === currentActiveBoardId)) {
            return currentActiveBoardId;
          }

          return boards[0]?.id ?? "";
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkspaceErrorMessage(
          getErrorMessage(error, "Unable to load workspace boards."),
        );
      }
    }

    void loadBoards();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId]);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveBoardDetail() {
      if (!activeBoardId) {
        return;
      }

      try {
        const detail = await getBoard(activeBoardId);
        if (!isMounted) {
          return;
        }

        setBoardDetailsById((current) => ({
          ...current,
          [activeBoardId]: detail,
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkspaceErrorMessage(
          getErrorMessage(error, "Unable to load board details."),
        );
      }
    }

    void loadActiveBoardDetail();

    return () => {
      isMounted = false;
    };
  }, [activeBoardId]);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveBoardCards() {
      if (!activeBoardId || activeBoardLists.length === 0) {
        return;
      }

      try {
        const cardsByList = await Promise.all(
          activeBoardLists.map(async (list) => ({
            listId: list.id,
            cards: await listCards(activeBoardId, list.id),
          })),
        );

        if (!isMounted) {
          return;
        }

        setCardsByListId((current) => {
          const next = { ...current };

          for (const item of cardsByList) {
            next[item.listId] = item.cards;
          }

          return next;
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkspaceErrorMessage(
          getErrorMessage(error, "Unable to load board cards."),
        );
      }
    }

    void loadActiveBoardCards();

    return () => {
      isMounted = false;
    };
  }, [activeBoardId, activeBoardLists]);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveBoardLists() {
      if (!activeBoardId) {
        return;
      }

      try {
        const lists = await listBoardLists(activeBoardId);
        if (!isMounted) {
          return;
        }

        setBoardListsById((current) => ({
          ...current,
          [activeBoardId]: lists,
        }));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkspaceErrorMessage(
          getErrorMessage(error, "Unable to load board lists."),
        );
      }
    }

    void loadActiveBoardLists();

    return () => {
      isMounted = false;
    };
  }, [activeBoardId]);

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
    let isMounted = true;

    async function loadWorkspaceActivity() {
      if (!workspaceDetailsWorkspaceId) {
        return;
      }

      try {
        const activity = await getWorkspaceActivity(workspaceDetailsWorkspaceId);
        if (!isMounted) {
          return;
        }

        setWorkspaceActivityById((current) => ({
          ...current,
          [workspaceDetailsWorkspaceId]: activity,
        }));
      } catch {
        if (!isMounted) {
          return;
        }
      }
    }

    void loadWorkspaceActivity();

    return () => {
      isMounted = false;
    };
  }, [workspaceDetailsWorkspaceId]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceMembersForBoardCreation() {
      if (!isCreateBoardModalOpen || !activeWorkspaceId) {
        setBoardCreationWorkspaceDetail(null);
        return;
      }

      try {
        const detail = await getWorkspace(activeWorkspaceId);
        if (!isMounted) {
          return;
        }

        setBoardCreationWorkspaceDetail(detail);
      } catch {
        if (!isMounted) {
          return;
        }

        setBoardCreationWorkspaceDetail(null);
      }
    }

    void loadWorkspaceMembersForBoardCreation();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, isCreateBoardModalOpen]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceMembersForBoardManagement() {
      if (
        (!isBoardMembersModalOpen && !isCreateBoardModalOpen) ||
        !activeWorkspaceId
      ) {
        if (!isBoardMembersModalOpen) {
          setBoardManagementWorkspaceDetail(null);
        }
        return;
      }

      try {
        const detail = await getWorkspace(activeWorkspaceId);
        if (!isMounted) {
          return;
        }

        setBoardManagementWorkspaceDetail(detail);
      } catch {
        if (!isMounted) {
          return;
        }

        setBoardManagementWorkspaceDetail(null);
      }
    }

    void loadWorkspaceMembersForBoardManagement();

    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, isBoardMembersModalOpen, isCreateBoardModalOpen]);

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

  async function refreshWorkspaceActivity(workspaceId: string) {
    const activity = await getWorkspaceActivity(workspaceId);
    setWorkspaceActivityById((current) => ({
      ...current,
      [workspaceId]: activity,
    }));
  }

  async function refreshBoardDetail(boardId: string) {
    const detail = await getBoard(boardId);
    setBoardDetailsById((current) => ({
      ...current,
      [boardId]: detail,
    }));
  }

  async function refreshBoardActivity(boardId: string) {
    const activity = await getBoardActivity(boardId);
    setBoardActivityById((current) => ({
      ...current,
      [boardId]: activity,
    }));
  }

  async function refreshBoardLists(boardId: string) {
    const lists = await listBoardLists(boardId);
    setBoardListsById((current) => ({
      ...current,
      [boardId]: lists,
    }));
  }

  async function refreshListCards(boardId: string, listId: string) {
    const cards = await listCards(boardId, listId);
    setCardsByListId((current) => ({
      ...current,
      [listId]: cards,
    }));
  }

  async function refreshCardDetail(input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) {
    const detail = await getCardDetail(input);
    setCardDetailsById((current) => ({
      ...current,
      [input.cardId]: detail,
    }));
  }

  async function refreshCardActivity(input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) {
    const activity = await getCardActivity(input);
    setCardActivityById((current) => ({
      ...current,
      [input.cardId]: activity,
    }));
  }

  async function handleCreateWorkspace(values: { name: string }) {
    const workspace = await createWorkspace(values);

    setWorkspaces((current) => [...current, workspace]);
    setActiveWorkspaceId(workspace.id);
    setIsCreateWorkspaceModalOpen(false);
    setIsWorkspaceMenuOpen(false);
    await refreshWorkspaceActivity(workspace.id);
  }

  async function handleCreateBoard(values: {
    title: string;
    description: string;
    visibility: BoardVisibility;
  }) {
    if (!activeWorkspaceId) {
      throw new Error("Choose a workspace before creating a board.");
    }

    const board = await createBoard({
      workspaceId: activeWorkspaceId,
      title: values.title,
      description: values.description,
      visibility: values.visibility,
    });

    setBoardsByWorkspaceId((current) => ({
      ...current,
      [activeWorkspaceId]: [...(current[activeWorkspaceId] ?? []), board],
    }));
    setBoardDetailsById((current) => ({
      ...current,
      [board.id]: {
        ...board,
        currentUserBoardRole: "MANAGER",
        labels: [],
        members: [],
      },
    }));
    setActiveBoardId(board.id);
    await refreshWorkspaceActivity(activeWorkspaceId);

    return board;
  }

  async function handleSubmitBoardMembers(input: {
    boardId: string;
    members: Array<{
      userId: string;
      role: BoardRole;
    }>;
  }) {
    await Promise.all(
      input.members.map((member) =>
        addBoardMember({
          boardId: input.boardId,
          userId: member.userId,
          role: member.role,
        }),
      ),
    );
    await refreshBoardDetail(input.boardId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleUpdateBoard(input: {
    boardId: string;
    title?: string;
    description?: string;
    visibility?: BoardVisibility;
    archived?: boolean;
  }) {
    const updatedBoard = await updateBoardRequest(input);

    if (!activeWorkspaceId) {
      return;
    }

    setBoardsByWorkspaceId((current) => {
      const currentBoards = current[activeWorkspaceId] ?? [];

      if (updatedBoard.archived) {
        const remainingBoards = currentBoards.filter(
          (board) => board.id !== updatedBoard.id,
        );

        setActiveBoardId((currentActiveBoardId) =>
          currentActiveBoardId === updatedBoard.id
            ? remainingBoards[0]?.id ?? ""
            : currentActiveBoardId,
        );

        return {
          ...current,
          [activeWorkspaceId]: remainingBoards,
        };
      }

      return {
        ...current,
        [activeWorkspaceId]: currentBoards.map((board) =>
          board.id === updatedBoard.id ? updatedBoard : board,
        ),
      };
    });

    await refreshBoardDetail(updatedBoard.id);
    await refreshBoardActivity(updatedBoard.id);
    await refreshWorkspaceActivity(activeWorkspaceId);
  }

  async function handleAddBoardMember(input: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }) {
    await addBoardMember(input);
    await refreshBoardDetail(input.boardId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleUpdateBoardMemberRole(input: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }) {
    await updateBoardMemberRoleRequest(input);
    await refreshBoardDetail(input.boardId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleRemoveBoardMember(input: {
    boardId: string;
    userId: string;
  }) {
    await removeBoardMember(input);
    await refreshBoardDetail(input.boardId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleCreateList(input: { boardId: string; title: string }) {
    const list = await createList(input);

    setBoardListsById((current) => ({
      ...current,
      [input.boardId]: [...(current[input.boardId] ?? []), list],
    }));
    await refreshBoardActivity(input.boardId);
  }

  async function handleRenameList(input: {
    boardId: string;
    listId: string;
    title: string;
  }) {
    const updatedList = await updateList(input);

    setBoardListsById((current) => ({
      ...current,
      [input.boardId]: (current[input.boardId] ?? []).map((list) =>
        list.id === updatedList.id ? updatedList : list,
      ),
    }));
    await refreshBoardActivity(input.boardId);
  }

  async function handleArchiveList(input: { boardId: string; listId: string }) {
    await deleteList(input);
    await refreshBoardLists(input.boardId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleCreateBoardLabel(input: {
    boardId: string;
    name: string;
    color: string;
  }) {
    const label = await createBoardLabel(input);
    await refreshBoardDetail(input.boardId);
    await refreshBoardActivity(input.boardId);
    return label;
  }

  async function handleCreateCard(input: {
    boardId: string;
    listId: string;
    title: string;
    description?: string;
    dueDate?: string;
    labelIds?: string[];
    assigneeIds?: string[];
    position: "top" | "bottom";
  }) {
    const existingCards = cardsByListId[input.listId] ?? [];
    const createdCard = await createCard(input);

    if (input.position === "top" && existingCards.length > 0) {
      await reorderCard({
        boardId: input.boardId,
        listId: input.listId,
        cardId: createdCard.id,
        afterId: existingCards[0]?.id,
      });
    }

    await refreshListCards(input.boardId, input.listId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleOpenCardDetail(input: {
    boardId: string;
    listId: string;
    cardId: string;
    initialTab: "details" | "comments";
  }) {
    await Promise.all([
      refreshCardDetail(input),
      refreshCardActivity(input),
    ]);
    setCardDetailModalState(input);
  }

  async function handleCreateCardComment(input: {
    boardId: string;
    listId: string;
    cardId: string;
    content: string;
  }) {
    await createCardComment(input);
    await Promise.all([
      refreshCardDetail(input),
      refreshCardActivity(input),
    ]);
  }

  async function handleUpdateCard(input: {
    boardId: string;
    listId: string;
    cardId: string;
    title: string;
    description?: string;
    dueDate?: string | null;
    labelIds?: string[];
    assigneeIds?: string[];
  }) {
    await updateCardRequest(input);
    await Promise.all([
      refreshListCards(input.boardId, input.listId),
      refreshCardDetail(input),
      refreshCardActivity(input),
      refreshBoardActivity(input.boardId),
    ]);
  }

  async function handleArchiveCard(input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) {
    await deleteCardRequest(input);
    await Promise.all([
      refreshListCards(input.boardId, input.listId),
      refreshBoardActivity(input.boardId),
    ]);
    setCardDetailsById((current) => {
      const next = { ...current };
      delete next[input.cardId];
      return next;
    });
    setCardActivityById((current) => {
      const next = { ...current };
      delete next[input.cardId];
      return next;
    });
    setCardDetailModalState((current) =>
      current?.cardId === input.cardId ? null : current,
    );
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
    await refreshWorkspaceActivity(workspace.id);
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
    await refreshWorkspaceActivity(workspaceId);
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
    await refreshWorkspaceActivity(input.workspaceId);
  }

  async function handleRemoveWorkspaceMember(input: {
    workspaceId: string;
    userId: string;
  }) {
    await removeWorkspaceMember(input);
    await refreshWorkspaceDetails(input.workspaceId);
    await refreshWorkspaceActivity(input.workspaceId);
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
          boardItems={activeBoards}
          isAccountMenuOpen={isAccountMenuOpen}
          isBoardCreationDisabled={!activeWorkspace}
          isSidebarOpen={isSidebarOpen}
          isWorkspaceMenuOpen={isWorkspaceMenuOpen}
          onAccountMenuToggle={() =>
            setIsAccountMenuOpen((currentState) => !currentState)
          }
          onBoardSelect={setActiveBoardId}
          onCreateBoard={() => setIsCreateBoardModalOpen(true)}
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
              boardName={activeBoard?.title ?? "Boards"}
              boardMembers={activeBoardDetail?.members ?? []}
              canManageBoard={
                activeBoardDetail?.currentUserBoardRole === "MANAGER"
              }
              isSidebarOpen={isSidebarOpen}
              onCreateList={() => {
                if (!activeBoard || activeBoardDetail?.currentUserBoardRole !== "MANAGER") {
                  return;
                }

                setCreateListRequestId((current) => current + 1);
              }}
              onOpenBoardActivity={() => {
                if (!activeBoard) {
                  return;
                }

                void refreshBoardActivity(activeBoard.id);
                setIsBoardActivityModalOpen(true);
              }}
              onOpenBoardMembers={() => {
                setIsBoardMembersModalOpen(true);
              }}
              onOpenBoardSettings={() => {
                setIsBoardSettingsModalOpen(true);
              }}
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
              <DashboardKanban
                activeBoardId={activeBoard?.id ?? ""}
                boardLabels={activeBoardDetail?.labels ?? []}
                boardMembers={activeBoardDetail?.members ?? []}
                canManageCards={
                  activeBoardDetail?.currentUserBoardRole === "MANAGER" ||
                  activeBoardDetail?.currentUserBoardRole === "CONTRIBUTOR"
                }
                canManageLists={
                  activeBoardDetail?.currentUserBoardRole === "MANAGER"
                }
                cardsByListId={cardsByListId}
                createListRequestId={createListRequestId}
                lists={activeBoardLists}
                onArchiveList={handleArchiveList}
                onCreateBoardLabel={handleCreateBoardLabel}
                onCreateCard={handleCreateCard}
                onCreateList={handleCreateList}
                onOpenCardComments={(input) =>
                  void handleOpenCardDetail({
                    ...input,
                    initialTab: "comments",
                  })
                }
                onOpenCardDetails={(input) =>
                  void handleOpenCardDetail({
                    ...input,
                    initialTab: "details",
                  })
                }
                onRenameList={handleRenameList}
              />
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

      {isCreateBoardModalOpen && activeWorkspace ? (
        <CreateBoardModal
          currentUserId={user.id}
          onClose={() => setIsCreateBoardModalOpen(false)}
          onCreateBoard={handleCreateBoard}
          onSubmitMembers={handleSubmitBoardMembers}
          workspaceMembers={boardCreationWorkspaceDetail?.members ?? []}
          workspaceName={activeWorkspace.name}
        />
      ) : null}

      {isBoardSettingsModalOpen && activeBoardDetail ? (
        <BoardSettingsModal
          board={activeBoardDetail}
          canManageBoard={
            activeBoardDetail.currentUserBoardRole === "MANAGER"
          }
          onClose={() => setIsBoardSettingsModalOpen(false)}
          onUpdateBoard={handleUpdateBoard}
        />
      ) : null}

      {isBoardMembersModalOpen && activeBoardDetail && boardManagementWorkspaceDetail ? (
        <BoardMembersModal
          board={activeBoardDetail}
          currentUserId={user.id}
          onAddMember={handleAddBoardMember}
          onClose={() => setIsBoardMembersModalOpen(false)}
          onRemoveMember={handleRemoveBoardMember}
          onUpdateMemberRole={handleUpdateBoardMemberRole}
          workspaceMembers={boardManagementWorkspaceDetail.members}
        />
      ) : null}

      {isBoardActivityModalOpen && activeBoard ? (
        <BoardActivityModal
          activityItems={boardActivityById[activeBoard.id] ?? []}
          boardName={activeBoard.title}
          onClose={() => setIsBoardActivityModalOpen(false)}
        />
      ) : null}

      {cardDetailModalState && cardDetailsById[cardDetailModalState.cardId] ? (
        <CardDetailModal
          activityItems={cardActivityById[cardDetailModalState.cardId] ?? []}
          boardLabels={activeBoardDetail?.labels ?? []}
          boardMembers={activeBoardDetail?.members ?? []}
          canArchiveCard={
            activeBoardDetail?.currentUserBoardRole === "MANAGER"
          }
          canEditCard={
            activeBoardDetail?.currentUserBoardRole === "MANAGER" ||
            activeBoardDetail?.currentUserBoardRole === "CONTRIBUTOR"
          }
          card={cardDetailsById[cardDetailModalState.cardId]!}
          initialTab={cardDetailModalState.initialTab}
          onArchiveCard={() =>
            handleArchiveCard({
              boardId: cardDetailModalState.boardId,
              listId: cardDetailModalState.listId,
              cardId: cardDetailModalState.cardId,
            })
          }
          onClose={() => setCardDetailModalState(null)}
          onCreateComment={(input) =>
            handleCreateCardComment({
              boardId: cardDetailModalState.boardId,
              listId: cardDetailModalState.listId,
              cardId: input.cardId,
              content: input.content,
            })
          }
          onUpdateCard={(input) =>
            handleUpdateCard({
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
