"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getErrorMessage,
  listSessions,
  logoutDeviceSession,
  logoutOtherDevices,
  type AuthUser,
} from "@/lib/auth";
import {
  createBoardEventsSocket,
  type BoardRealtimeEvent,
} from "@/lib/board-events";
import {
  addBoardMember,
  createBoard,
  createBoardLabel,
  deleteBoard as deleteBoardRequest,
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
  moveCard as moveCardRequest,
  reorderCard,
  updateCard as updateCardRequest,
} from "@/lib/cards";
import {
  createList,
  deleteList,
  listBoardLists,
  reorderList as reorderListRequest,
  updateList,
} from "@/lib/lists";
import {
  createWorkspace,
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
} from "@/lib/workspaces";

import type {
  BoardActivityItem,
  BoardCard,
  BoardCardActivityItem,
  BoardCardDetail,
  BoardDetail,
  BoardList,
  BoardRole,
  BoardSummary,
  BoardVisibility,
} from "./board-types";
import { dashboardQueryKeys } from "./dashboard-query-keys";
import {
  getSortedCards,
  getSortedLists,
  moveItem,
  renumberCards,
  renumberLists,
} from "./dashboard-shell-utils";
import {
  type CardDetailModalState,
  useDashboardUiStore,
} from "./use-dashboard-ui-store";
import type {
  WorkspaceActivityItem,
  WorkspaceDetail,
  WorkspaceInviteResponse,
  WorkspaceSummary,
} from "./workspace-types";

export function useDashboardShell(user: AuthUser) {
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const activeBoardId = useDashboardUiStore((state) => state.activeBoardId);
  const activeWorkspaceId = useDashboardUiStore((state) => state.activeWorkspaceId);
  const cardDetailModalState = useDashboardUiStore(
    (state) => state.cardDetailModalState,
  );
  const createListRequestId = useDashboardUiStore(
    (state) => state.createListRequestId,
  );
  const isAccountMenuOpen = useDashboardUiStore(
    (state) => state.isAccountMenuOpen,
  );
  const isAccountSettingsModalOpen = useDashboardUiStore(
    (state) => state.isAccountSettingsModalOpen,
  );
  const isBoardActivityModalOpen = useDashboardUiStore(
    (state) => state.isBoardActivityModalOpen,
  );
  const isBoardMembersModalOpen = useDashboardUiStore(
    (state) => state.isBoardMembersModalOpen,
  );
  const isBoardSettingsModalOpen = useDashboardUiStore(
    (state) => state.isBoardSettingsModalOpen,
  );
  const isCreateBoardModalOpen = useDashboardUiStore(
    (state) => state.isCreateBoardModalOpen,
  );
  const isCreateWorkspaceModalOpen = useDashboardUiStore(
    (state) => state.isCreateWorkspaceModalOpen,
  );
  const isJoinWorkspaceModalOpen = useDashboardUiStore(
    (state) => state.isJoinWorkspaceModalOpen,
  );
  const isSidebarOpen = useDashboardUiStore((state) => state.isSidebarOpen);
  const isWorkspaceMenuOpen = useDashboardUiStore(
    (state) => state.isWorkspaceMenuOpen,
  );
  const setActiveBoardId = useDashboardUiStore((state) => state.setActiveBoardId);
  const setActiveWorkspaceId = useDashboardUiStore(
    (state) => state.setActiveWorkspaceId,
  );
  const setCardDetailModalState = useDashboardUiStore(
    (state) => state.setCardDetailModalState,
  );
  const setCreateListRequestId = useDashboardUiStore(
    (state) => state.setCreateListRequestId,
  );
  const setIsAccountMenuOpen = useDashboardUiStore(
    (state) => state.setIsAccountMenuOpen,
  );
  const setIsAccountSettingsModalOpen = useDashboardUiStore(
    (state) => state.setIsAccountSettingsModalOpen,
  );
  const setIsBoardActivityModalOpen = useDashboardUiStore(
    (state) => state.setIsBoardActivityModalOpen,
  );
  const setIsBoardMembersModalOpen = useDashboardUiStore(
    (state) => state.setIsBoardMembersModalOpen,
  );
  const setIsBoardSettingsModalOpen = useDashboardUiStore(
    (state) => state.setIsBoardSettingsModalOpen,
  );
  const setIsCreateBoardModalOpen = useDashboardUiStore(
    (state) => state.setIsCreateBoardModalOpen,
  );
  const setIsCreateWorkspaceModalOpen = useDashboardUiStore(
    (state) => state.setIsCreateWorkspaceModalOpen,
  );
  const setIsJoinWorkspaceModalOpen = useDashboardUiStore(
    (state) => state.setIsJoinWorkspaceModalOpen,
  );
  const setIsSidebarOpen = useDashboardUiStore((state) => state.setIsSidebarOpen);
  const setIsWorkspaceMenuOpen = useDashboardUiStore(
    (state) => state.setIsWorkspaceMenuOpen,
  );
  const setWorkspaceDetailsWorkspaceId = useDashboardUiStore(
    (state) => state.setWorkspaceDetailsWorkspaceId,
  );
  const workspaceDetailsWorkspaceId = useDashboardUiStore(
    (state) => state.workspaceDetailsWorkspaceId,
  );

  const workspacesQuery = useQuery({
    queryKey: dashboardQueryKeys.workspaces.all,
    queryFn: listWorkspaces,
  });

  const workspaces = useMemo(
    () => workspacesQuery.data ?? [],
    [workspacesQuery.data],
  );

  useEffect(() => {
    setActiveWorkspaceId((currentActiveWorkspaceId) => {
      if (
        currentActiveWorkspaceId &&
        workspaces.some((workspace) => workspace.id === currentActiveWorkspaceId)
      ) {
        return currentActiveWorkspaceId;
      }

      return workspaces[0]?.id ?? "";
    });
  }, [setActiveWorkspaceId, workspaces]);

  const activeWorkspace = useMemo(
    () => workspaces.find((item) => item.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  );

  const boardsQuery = useQuery({
    queryKey: dashboardQueryKeys.boards.list(activeWorkspaceId),
    queryFn: () => listWorkspaceBoards(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId),
  });

  const activeBoards = useMemo(
    () => boardsQuery.data ?? [],
    [boardsQuery.data],
  );

  useEffect(() => {
    if (!activeWorkspaceId) {
      setActiveBoardId("");
      return;
    }

    setActiveBoardId((currentActiveBoardId) => {
      if (activeBoards.some((board) => board.id === currentActiveBoardId)) {
        return currentActiveBoardId;
      }

      return activeBoards[0]?.id ?? "";
    });
  }, [activeBoards, activeWorkspaceId, setActiveBoardId]);

  const activeBoard = useMemo(
    () => activeBoards.find((item) => item.id === activeBoardId) ?? activeBoards[0] ?? null,
    [activeBoardId, activeBoards],
  );

  const activeBoardDetailQuery = useQuery({
    queryKey: dashboardQueryKeys.boards.detail(activeBoardId),
    queryFn: () => getBoard(activeBoardId),
    enabled: Boolean(activeBoardId),
  });

  const activeBoardDetail = activeBoardDetailQuery.data ?? null;

  const activeBoardListsQuery = useQuery({
    queryKey: dashboardQueryKeys.boards.lists(activeBoardId),
    queryFn: () => listBoardLists(activeBoardId),
    enabled: Boolean(activeBoardId),
  });

  const activeBoardLists = useMemo(
    () => activeBoardListsQuery.data ?? [],
    [activeBoardListsQuery.data],
  );

  const cardListQueries = useQueries({
    queries: activeBoardLists.map((list) => ({
      queryKey: dashboardQueryKeys.cards.list(activeBoardId, list.id),
      queryFn: () => listCards(activeBoardId, list.id),
      enabled: Boolean(activeBoardId),
    })),
  });

  const cardsByListId = useMemo<Record<string, BoardCard[]>>(
    () =>
      Object.fromEntries(
        activeBoardLists.map((list, index) => [list.id, cardListQueries[index]?.data ?? []]),
      ),
    [activeBoardLists, cardListQueries],
  );

  const workspaceDetailsQuery = useQuery({
    queryKey: dashboardQueryKeys.workspaces.detail(workspaceDetailsWorkspaceId ?? ""),
    queryFn: () => getWorkspace(workspaceDetailsWorkspaceId!),
    enabled: Boolean(workspaceDetailsWorkspaceId),
  });

  const workspaceDetails = workspaceDetailsQuery.data ?? null;

  const workspaceActivityQuery = useQuery({
    queryKey: dashboardQueryKeys.workspaces.activity(workspaceDetailsWorkspaceId ?? ""),
    queryFn: () => getWorkspaceActivity(workspaceDetailsWorkspaceId!),
    enabled: Boolean(workspaceDetailsWorkspaceId),
  });

  const boardCreationWorkspaceDetailQuery = useQuery({
    queryKey: dashboardQueryKeys.workspaces.detail(activeWorkspaceId),
    queryFn: () => getWorkspace(activeWorkspaceId),
    enabled: isCreateBoardModalOpen && Boolean(activeWorkspaceId),
  });

  const boardManagementWorkspaceDetailQuery = useQuery({
    queryKey: dashboardQueryKeys.workspaces.detail(activeWorkspaceId),
    queryFn: () => getWorkspace(activeWorkspaceId),
    enabled: isBoardMembersModalOpen && Boolean(activeWorkspaceId),
  });

  const activeBoardActivityQuery = useQuery({
    queryKey: dashboardQueryKeys.boards.activity(activeBoardId),
    queryFn: () => getBoardActivity(activeBoardId),
    enabled: isBoardActivityModalOpen && Boolean(activeBoardId),
  });

  const activeCardDetailQuery = useQuery({
    queryKey: cardDetailModalState
      ? dashboardQueryKeys.cards.detail(
          cardDetailModalState.boardId,
          cardDetailModalState.listId,
          cardDetailModalState.cardId,
        )
      : ["cards", "detail", "idle"],
    queryFn: () =>
      getCardDetail({
        boardId: cardDetailModalState!.boardId,
        listId: cardDetailModalState!.listId,
        cardId: cardDetailModalState!.cardId,
      }),
    enabled: Boolean(cardDetailModalState),
  });

  const activeCardActivityQuery = useQuery({
    queryKey: cardDetailModalState
      ? dashboardQueryKeys.cards.activity(
          cardDetailModalState.boardId,
          cardDetailModalState.listId,
          cardDetailModalState.cardId,
        )
      : ["cards", "activity", "idle"],
    queryFn: () =>
      getCardActivity({
        boardId: cardDetailModalState!.boardId,
        listId: cardDetailModalState!.listId,
        cardId: cardDetailModalState!.cardId,
      }),
    enabled: Boolean(cardDetailModalState),
  });

  const accountSessionsQuery = useQuery({
    queryKey: dashboardQueryKeys.auth.sessions,
    queryFn: listSessions,
    enabled: isAccountSettingsModalOpen,
  });

  const boardActivityById = useMemo<Record<string, BoardActivityItem[]>>(
    () =>
      activeBoard && activeBoardActivityQuery.data
        ? { [activeBoard.id]: activeBoardActivityQuery.data }
        : {},
    [activeBoard, activeBoardActivityQuery.data],
  );

  const workspaceActivityById = useMemo<Record<string, WorkspaceActivityItem[]>>(
    () =>
      workspaceDetailsWorkspaceId && workspaceActivityQuery.data
        ? { [workspaceDetailsWorkspaceId]: workspaceActivityQuery.data }
        : {},
    [workspaceActivityQuery.data, workspaceDetailsWorkspaceId],
  );

  const cardDetailsById = useMemo<Record<string, BoardCardDetail>>(
    () =>
      cardDetailModalState && activeCardDetailQuery.data
        ? { [cardDetailModalState.cardId]: activeCardDetailQuery.data }
        : {},
    [activeCardDetailQuery.data, cardDetailModalState],
  );

  const cardActivityById = useMemo<Record<string, BoardCardActivityItem[]>>(
    () =>
      cardDetailModalState && activeCardActivityQuery.data
        ? { [cardDetailModalState.cardId]: activeCardActivityQuery.data }
        : {},
    [activeCardActivityQuery.data, cardDetailModalState],
  );

  const workspaceErrorMessage = useMemo(() => {
    const firstError =
      workspacesQuery.error ??
      boardsQuery.error ??
      activeBoardDetailQuery.error ??
      activeBoardListsQuery.error ??
      cardListQueries.find((query) => query.error)?.error;

    return firstError
      ? getErrorMessage(firstError, "Unable to load dashboard data.")
      : null;
  }, [
    activeBoardDetailQuery.error,
    activeBoardListsQuery.error,
    boardsQuery.error,
    cardListQueries,
    workspacesQuery.error,
  ]);

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
  }, [
    accountMenuRef,
    isAccountMenuOpen,
    isWorkspaceMenuOpen,
    setIsAccountMenuOpen,
    setIsWorkspaceMenuOpen,
    workspaceMenuRef,
  ]);

  async function refreshWorkspaceDetails(workspaceId: string) {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.workspaces.detail(workspaceId),
    });
  }

  async function refreshWorkspaceActivity(workspaceId: string) {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.workspaces.activity(workspaceId),
    });
  }

  async function refreshBoardDetail(boardId: string) {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.boards.detail(boardId),
    });
  }

  async function refreshBoardActivity(boardId: string) {
    await queryClient.fetchQuery({
      queryKey: dashboardQueryKeys.boards.activity(boardId),
      queryFn: () => getBoardActivity(boardId),
    });
  }

  async function refreshListCards(boardId: string, listId: string) {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.cards.list(boardId, listId),
    });
  }

  async function refreshCardDetail(input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.cards.detail(
        input.boardId,
        input.listId,
        input.cardId,
      ),
    });
  }

  async function refreshCardActivity(input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.cards.activity(
        input.boardId,
        input.listId,
        input.cardId,
      ),
    });
  }

  async function refreshAccountSessions() {
    await queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.auth.sessions,
    });
  }

  useEffect(() => {
    if (!activeBoardId) {
      return;
    }

    const socket = createBoardEventsSocket();
    if (!socket) {
      return;
    }

    function invalidateBoardEventData(event: BoardRealtimeEvent) {
      if (event.boardId !== activeBoardId) {
        return;
      }

      const affectedListIds = Array.from(
        new Set(
          [
            ...(event.affectedListIds ?? []),
            event.listId,
            event.targetListId,
          ].filter(Boolean) as string[],
        ),
      );
      const shouldRefreshLists =
        event.type.startsWith("list.") || event.type === "board.deleted";
      const shouldRefreshBoardDetail =
        event.type.startsWith("board.") ||
        event.type === "card.created" ||
        event.type === "card.updated";

      if (event.workspaceId && event.workspaceId === activeWorkspaceId) {
        void queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.boards.list(event.workspaceId),
        });
      }

      if (shouldRefreshBoardDetail) {
        void queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.boards.detail(event.boardId),
        });
      }

      if (shouldRefreshLists) {
        void queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.boards.lists(event.boardId),
        });
      }

      void queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.boards.activity(event.boardId),
      });

      for (const listId of affectedListIds) {
        void queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.cards.list(event.boardId, listId),
        });
      }

      if (
        event.cardId &&
        cardDetailModalState?.cardId === event.cardId &&
        cardDetailModalState.boardId === event.boardId
      ) {
        void queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.cards.detail(
            cardDetailModalState.boardId,
            cardDetailModalState.listId,
            cardDetailModalState.cardId,
          ),
        });
        void queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.cards.activity(
            cardDetailModalState.boardId,
            cardDetailModalState.listId,
            cardDetailModalState.cardId,
          ),
        });
      }
    }

    socket.on("connect", () => {
      socket.emit("board:join", { boardId: activeBoardId });
    });
    socket.on("board:event", invalidateBoardEventData);

    return () => {
      socket.emit("board:leave", { boardId: activeBoardId });
      socket.off("board:event", invalidateBoardEventData);
      socket.disconnect();
    };
  }, [
    activeBoardId,
    activeWorkspaceId,
    cardDetailModalState?.boardId,
    cardDetailModalState?.cardId,
    cardDetailModalState?.listId,
    queryClient,
  ]);

  async function handleCreateWorkspace(values: { name: string }) {
    const workspace = await createWorkspace(values);

    queryClient.setQueryData<WorkspaceSummary[]>(
      dashboardQueryKeys.workspaces.all,
      (current = []) => [...current, workspace],
    );

    setActiveWorkspaceId(workspace.id);
    setIsCreateWorkspaceModalOpen(false);
    setIsWorkspaceMenuOpen(false);
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

    queryClient.setQueryData<BoardSummary[]>(
      dashboardQueryKeys.boards.list(activeWorkspaceId),
      (current = []) => [...current, board],
    );
    queryClient.setQueryData<BoardDetail>(dashboardQueryKeys.boards.detail(board.id), {
      ...board,
      currentUserBoardRole: "MANAGER",
      labels: [],
      members: [],
    });

    setActiveBoardId(board.id);
    return board;
  }

  async function handleSubmitBoardMembers(input: {
    boardId: string;
    members: Array<{ userId: string; role: BoardRole }>;
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
    await Promise.all([
      refreshBoardDetail(input.boardId),
      refreshBoardActivity(input.boardId),
    ]);
  }

  async function handleUpdateBoard(input: {
    boardId: string;
    title?: string;
    description?: string;
    visibility?: BoardVisibility;
  }) {
    const updatedBoard = await updateBoardRequest(input);

    if (activeWorkspaceId) {
      queryClient.setQueryData<BoardSummary[]>(
        dashboardQueryKeys.boards.list(activeWorkspaceId),
        (current = []) =>
          current.map((board) =>
            board.id === updatedBoard.id ? updatedBoard : board,
          ),
      );
    }

    await Promise.all([
      refreshBoardDetail(updatedBoard.id),
      refreshBoardActivity(updatedBoard.id),
    ]);
  }

  async function handleDeleteBoard(input: { boardId: string }) {
    await deleteBoardRequest(input);

    if (activeWorkspaceId) {
      queryClient.setQueryData<BoardSummary[]>(
        dashboardQueryKeys.boards.list(activeWorkspaceId),
        (current = []) => {
          const remainingBoards = current.filter((board) => board.id !== input.boardId);

          setActiveBoardId((currentActiveBoardId) =>
            currentActiveBoardId === input.boardId
              ? remainingBoards[0]?.id ?? ""
              : currentActiveBoardId,
          );

          return remainingBoards;
        },
      );
    }

    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.boards.detail(input.boardId),
    });
    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.boards.activity(input.boardId),
    });
    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.boards.lists(input.boardId),
    });

    setCardDetailModalState((current) =>
      current?.boardId === input.boardId ? null : current,
    );
  }

  async function handleAddBoardMember(input: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }) {
    await addBoardMember(input);
    await Promise.all([
      refreshBoardDetail(input.boardId),
      refreshBoardActivity(input.boardId),
    ]);
  }

  async function handleUpdateBoardMemberRole(input: {
    boardId: string;
    userId: string;
    role: BoardRole;
  }) {
    await updateBoardMemberRoleRequest(input);
    await Promise.all([
      refreshBoardDetail(input.boardId),
      refreshBoardActivity(input.boardId),
    ]);
  }

  async function handleRemoveBoardMember(input: {
    boardId: string;
    userId: string;
  }) {
    await removeBoardMember(input);
    await Promise.all([
      refreshBoardDetail(input.boardId),
      refreshBoardActivity(input.boardId),
    ]);
  }

  async function handleCreateList(input: { boardId: string; title: string }) {
    const list = await createList(input);

    queryClient.setQueryData<BoardList[]>(
      dashboardQueryKeys.boards.lists(input.boardId),
      (current = []) => [...current, list],
    );
    await refreshBoardActivity(input.boardId);
  }

  async function handleRenameList(input: {
    boardId: string;
    listId: string;
    title: string;
  }) {
    const updatedList = await updateList(input);

    queryClient.setQueryData<BoardList[]>(
      dashboardQueryKeys.boards.lists(input.boardId),
      (current = []) =>
        current.map((list) => (list.id === updatedList.id ? updatedList : list)),
    );
    await refreshBoardActivity(input.boardId);
  }

  async function handleDeleteList(input: { boardId: string; listId: string }) {
    await deleteList(input);

    queryClient.setQueryData<BoardList[]>(
      dashboardQueryKeys.boards.lists(input.boardId),
      (current = []) => current.filter((list) => list.id !== input.listId),
    );
    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.cards.list(input.boardId, input.listId),
    });
    await refreshBoardActivity(input.boardId);
  }

  async function handleReorderList(input: {
    boardId: string;
    listId: string;
    beforeId?: string;
    afterId?: string;
    toIndex: number;
  }) {
    const previousLists =
      queryClient.getQueryData<BoardList[]>(dashboardQueryKeys.boards.lists(input.boardId)) ??
      [];
    const orderedLists = getSortedLists(previousLists);
    const fromIndex = orderedLists.findIndex((list) => list.id === input.listId);

    if (fromIndex === -1 || fromIndex === input.toIndex) {
      return;
    }

    const nextLists = renumberLists(moveItem(orderedLists, fromIndex, input.toIndex));

    queryClient.setQueryData(dashboardQueryKeys.boards.lists(input.boardId), nextLists);

    try {
      await reorderListRequest(input);
      await refreshBoardActivity(input.boardId);
    } catch (error) {
      queryClient.setQueryData(
        dashboardQueryKeys.boards.lists(input.boardId),
        previousLists,
      );
      throw error;
    }
  }

  async function handleCreateBoardLabel(input: {
    boardId: string;
    name: string;
    color: string;
  }) {
    const label = await createBoardLabel(input);
    await Promise.all([
      refreshBoardDetail(input.boardId),
      refreshBoardActivity(input.boardId),
    ]);
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

    await Promise.all([
      refreshListCards(input.boardId, input.listId),
      refreshBoardActivity(input.boardId),
    ]);
  }

  async function handleMoveCard(input: {
    boardId: string;
    cardId: string;
    sourceListId: string;
    targetListId: string;
    beforeId?: string;
    afterId?: string;
    targetIndex: number;
  }) {
    const sourceCards = getSortedCards(cardsByListId[input.sourceListId] ?? []);
    const targetCards =
      input.sourceListId === input.targetListId
        ? sourceCards
        : getSortedCards(cardsByListId[input.targetListId] ?? []);
    const movingCard = sourceCards.find((card) => card.id === input.cardId);

    if (!movingCard) {
      return;
    }

    const previousSourceCards = cardsByListId[input.sourceListId] ?? [];
    const previousTargetCards = cardsByListId[input.targetListId] ?? [];

    if (input.sourceListId === input.targetListId) {
      const fromIndex = sourceCards.findIndex((card) => card.id === input.cardId);

      if (fromIndex === -1 || fromIndex === input.targetIndex) {
        return;
      }

      const nextCards = renumberCards(
        moveItem(sourceCards, fromIndex, input.targetIndex),
        input.sourceListId,
      );

      queryClient.setQueryData(
        dashboardQueryKeys.cards.list(input.boardId, input.sourceListId),
        nextCards,
      );

      try {
        await reorderCard({
          boardId: input.boardId,
          listId: input.sourceListId,
          cardId: input.cardId,
          beforeId: input.beforeId,
          afterId: input.afterId,
        });
        await refreshBoardActivity(input.boardId);
      } catch (error) {
        queryClient.setQueryData(
          dashboardQueryKeys.cards.list(input.boardId, input.sourceListId),
          previousSourceCards,
        );
        throw error;
      }

      return;
    }

    const remainingSourceCards = sourceCards.filter((card) => card.id !== input.cardId);
    const nextTargetCards = [...targetCards];

    nextTargetCards.splice(input.targetIndex, 0, {
      ...movingCard,
      listId: input.targetListId,
    });

    queryClient.setQueryData(
      dashboardQueryKeys.cards.list(input.boardId, input.sourceListId),
      renumberCards(remainingSourceCards, input.sourceListId),
    );
    queryClient.setQueryData(
      dashboardQueryKeys.cards.list(input.boardId, input.targetListId),
      renumberCards(nextTargetCards, input.targetListId),
    );

    try {
      await moveCardRequest({
        boardId: input.boardId,
        listId: input.sourceListId,
        cardId: input.cardId,
        targetListId: input.targetListId,
        beforeId: input.beforeId,
        afterId: input.afterId,
      });
      await Promise.all([
        refreshListCards(input.boardId, input.sourceListId),
        refreshListCards(input.boardId, input.targetListId),
        refreshBoardActivity(input.boardId),
        refreshCardDetail({
          boardId: input.boardId,
          listId: input.targetListId,
          cardId: input.cardId,
        }).catch(() => undefined),
      ]);
    } catch (error) {
      queryClient.setQueryData(
        dashboardQueryKeys.cards.list(input.boardId, input.sourceListId),
        previousSourceCards,
      );
      queryClient.setQueryData(
        dashboardQueryKeys.cards.list(input.boardId, input.targetListId),
        previousTargetCards,
      );
      throw error;
    }
  }

  async function handleOpenCardDetail(input: CardDetailModalState) {
    await Promise.all([
      queryClient.fetchQuery({
        queryKey: dashboardQueryKeys.cards.detail(
          input.boardId,
          input.listId,
          input.cardId,
        ),
        queryFn: () => getCardDetail(input),
      }),
      queryClient.fetchQuery({
        queryKey: dashboardQueryKeys.cards.activity(
          input.boardId,
          input.listId,
          input.cardId,
        ),
        queryFn: () => getCardActivity(input),
      }),
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
    await Promise.all([refreshCardDetail(input), refreshCardActivity(input)]);
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

  async function handleDeleteCard(input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) {
    await deleteCardRequest(input);
    await Promise.all([
      refreshListCards(input.boardId, input.listId),
      refreshBoardActivity(input.boardId),
    ]);
    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.cards.detail(
        input.boardId,
        input.listId,
        input.cardId,
      ),
    });
    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.cards.activity(
        input.boardId,
        input.listId,
        input.cardId,
      ),
    });
    setCardDetailModalState((current) =>
      current?.cardId === input.cardId ? null : current,
    );
  }

  async function handleJoinWorkspace(values: { code: string }) {
    const workspace = await joinWorkspace(values);

    queryClient.setQueryData<WorkspaceSummary[]>(
      dashboardQueryKeys.workspaces.all,
      (current = []) => {
        if (current.some((item) => item.id === workspace.id)) {
          return current.map((item) =>
            item.id === workspace.id ? workspace : item,
          );
        }

        return [...current, workspace];
      },
    );

    setActiveWorkspaceId(workspace.id);
    setIsJoinWorkspaceModalOpen(false);
  }

  async function handleUpdateWorkspace(
    workspaceId: string,
    updates: Pick<WorkspaceSummary, "name">,
  ) {
    const updatedWorkspace = await updateWorkspace(workspaceId, updates);

    queryClient.setQueryData<WorkspaceSummary[]>(
      dashboardQueryKeys.workspaces.all,
      (current = []) =>
        current.map((workspace) =>
          workspace.id === workspaceId
            ? { ...workspace, ...updatedWorkspace }
            : workspace,
        ),
    );
    queryClient.setQueryData<WorkspaceDetail>(
      dashboardQueryKeys.workspaces.detail(workspaceId),
      (current) => (current ? { ...current, ...updatedWorkspace } : current),
    );
    await refreshWorkspaceActivity(workspaceId);
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    await deleteWorkspace(workspaceId);

    queryClient.setQueryData<WorkspaceSummary[]>(
      dashboardQueryKeys.workspaces.all,
      (current = []) => {
        const remaining = current.filter((workspace) => workspace.id !== workspaceId);

        setActiveWorkspaceId((previous) => {
          if (previous !== workspaceId) {
            return previous;
          }

          return remaining[0]?.id ?? "";
        });

        return remaining;
      },
    );

    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.workspaces.detail(workspaceId),
    });
    queryClient.removeQueries({
      queryKey: dashboardQueryKeys.workspaces.activity(workspaceId),
    });

    setWorkspaceDetailsWorkspaceId(null);
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
    await Promise.all([
      refreshWorkspaceDetails(input.workspaceId),
      refreshWorkspaceActivity(input.workspaceId),
    ]);
  }

  async function handleRemoveWorkspaceMember(input: {
    workspaceId: string;
    userId: string;
  }) {
    await removeWorkspaceMember(input);
    await Promise.all([
      refreshWorkspaceDetails(input.workspaceId),
      refreshWorkspaceActivity(input.workspaceId),
    ]);
  }

  async function handleLeaveWorkspace(workspaceId: string) {
    await leaveWorkspace(workspaceId);

    queryClient.setQueryData<WorkspaceSummary[]>(
      dashboardQueryKeys.workspaces.all,
      (current = []) => {
        const remaining = current.filter((workspace) => workspace.id !== workspaceId);

        setActiveWorkspaceId((previous) => {
          if (previous !== workspaceId) {
            return previous;
          }

          return remaining[0]?.id ?? "";
        });

        return remaining;
      },
    );

    setWorkspaceDetailsWorkspaceId(null);
  }

  async function handleLogoutOtherDevices() {
    await logoutOtherDevices();
    await refreshAccountSessions();
  }

  async function handleLogoutDeviceSession(sessionId: string) {
    await logoutDeviceSession(sessionId);
    await refreshAccountSessions();
  }

  return {
    accountSessions: accountSessionsQuery.data ?? [],
    accountSessionsErrorMessage: accountSessionsQuery.error
      ? getErrorMessage(accountSessionsQuery.error, "Unable to load devices.")
      : null,
    accountSessionsStatus: accountSessionsQuery.status,
    accountMenuRef,
    activeBoard,
    activeBoardDetail,
    activeBoardLists,
    activeBoards,
    activeWorkspace,
    boardActivityById,
    boardCreationWorkspaceDetail: boardCreationWorkspaceDetailQuery.data ?? null,
    boardManagementWorkspaceDetail:
      boardManagementWorkspaceDetailQuery.data ?? null,
    cardActivityById,
    cardDetailModalState,
    cardDetailsById,
    cardsByListId,
    createListRequestId,
    handleAddBoardMember,
    handleCreateBoard,
    handleCreateBoardLabel,
    handleCreateCard,
    handleCreateCardComment,
    handleCreateList,
    handleCreateWorkspace,
    handleDeleteBoard,
    handleDeleteCard,
    handleDeleteList,
    handleDeleteWorkspace,
    handleInviteWorkspaceMember,
    handleJoinWorkspace,
    handleLogoutDeviceSession,
    handleLogoutOtherDevices,
    handleLeaveWorkspace,
    handleMoveCard,
    handleOpenCardDetail,
    handleRemoveBoardMember,
    handleRemoveWorkspaceMember,
    handleRenameList,
    handleReorderList,
    handleSubmitBoardMembers,
    handleUpdateBoard,
    handleUpdateBoardMemberRole,
    handleUpdateCard,
    handleUpdateWorkspace,
    handleUpdateWorkspaceMemberRole,
    isAccountMenuOpen,
    isAccountSettingsModalOpen,
    isBoardActivityModalOpen,
    isBoardMembersModalOpen,
    isBoardSettingsModalOpen,
    isCreateBoardModalOpen,
    isCreateWorkspaceModalOpen,
    isJoinWorkspaceModalOpen,
    isSidebarOpen,
    isWorkspaceMenuOpen,
    setCardDetailModalState,
    setCreateListRequestId,
    setIsAccountMenuOpen,
    setIsAccountSettingsModalOpen,
    setIsBoardActivityModalOpen,
    setIsBoardMembersModalOpen,
    setIsBoardSettingsModalOpen,
    setIsCreateBoardModalOpen,
    setIsCreateWorkspaceModalOpen,
    setIsJoinWorkspaceModalOpen,
    setIsSidebarOpen,
    setIsWorkspaceMenuOpen,
    setWorkspaceDetailsWorkspaceId,
    userInitials: user.name.trim().slice(0, 2).toUpperCase() || "U",
    workspaceDetails,
    workspaceActivityById,
    workspaceErrorMessage,
    workspaceMenuRef,
    workspaces,
    setActiveBoardId,
    setActiveWorkspaceId,
    refreshBoardActivity,
  };
}
