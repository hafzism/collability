"use client";

import { useEffect, useMemo, useState } from "react";

import { getErrorMessage, type AuthUser } from "@/lib/auth";
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
import {
  getSortedCards,
  getSortedLists,
  moveItem,
  renumberCards,
  renumberLists,
} from "./dashboard-shell-utils";
import type {
  WorkspaceActivityItem,
  WorkspaceInviteResponse,
  WorkspaceSummary,
} from "./workspace-types";
import { type CardDetailModalState, useDashboardUiState } from "./use-dashboard-ui-state";

const initialWorkspaces: WorkspaceSummary[] = [];
const initialWorkspaceActivity: Record<string, WorkspaceActivityItem[]> = {};

export function useDashboardShell(user: AuthUser) {
  const ui = useDashboardUiState();
  const {
    accountMenuRef,
    activeBoardId,
    activeWorkspaceId,
    isAccountMenuOpen,
    isBoardMembersModalOpen,
    isCreateBoardModalOpen,
    isWorkspaceMenuOpen,
    setActiveBoardId,
    setActiveWorkspaceId,
    setBoardCreationWorkspaceDetail,
    setBoardManagementWorkspaceDetail,
    setIsAccountMenuOpen,
    setIsWorkspaceMenuOpen,
    setWorkspaceDetails,
    setWorkspaceErrorMessage,
    workspaceDetailsWorkspaceId,
    workspaceMenuRef,
  } = ui;
  const [boardActivityById, setBoardActivityById] = useState<
    Record<string, BoardActivityItem[]>
  >({});
  const [boardDetailsById, setBoardDetailsById] = useState<Record<string, BoardDetail>>(
    {},
  );
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
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(initialWorkspaces);
  const [workspaceActivityById, setWorkspaceActivityById] = useState<
    Record<string, WorkspaceActivityItem[]>
  >(initialWorkspaceActivity);

  const activeWorkspace = useMemo(
    () => workspaces.find((item) => item.id === activeWorkspaceId) ?? null,
    [activeWorkspaceId, workspaces],
  );
  const activeBoards = useMemo(
    () => (activeWorkspaceId ? boardsByWorkspaceId[activeWorkspaceId] ?? [] : []),
    [activeWorkspaceId, boardsByWorkspaceId],
  );
  const activeBoard = useMemo(
    () => activeBoards.find((item) => item.id === activeBoardId) ?? activeBoards[0] ?? null,
    [activeBoardId, activeBoards],
  );
  const activeBoardDetail = useMemo(
    () => (activeBoard ? boardDetailsById[activeBoard.id] ?? null : null),
    [activeBoard, boardDetailsById],
  );
  const activeBoardLists = useMemo(
    () => (activeBoard ? boardListsById[activeBoard.id] ?? [] : []),
    [activeBoard, boardListsById],
  );
  const userInitials = useMemo(
    () => user.name.trim().slice(0, 2).toUpperCase() || "U",
    [user.name],
  );

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
        if (isMounted) {
          setWorkspaceErrorMessage(
            getErrorMessage(error, "Unable to load your workspaces."),
          );
        }
      }
    }

    void loadWorkspaces();
    return () => {
      isMounted = false;
    };
  }, [setActiveWorkspaceId, setWorkspaceErrorMessage]);

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
        if (isMounted) {
          setWorkspaceErrorMessage(
            getErrorMessage(error, "Unable to load workspace boards."),
          );
        }
      }
    }

    void loadBoards();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, setActiveBoardId, setWorkspaceErrorMessage]);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveBoardDetail() {
      if (!activeBoardId) {
        return;
      }

      try {
        const detail = await getBoard(activeBoardId);
        if (isMounted) {
          setBoardDetailsById((current) => ({
            ...current,
            [activeBoardId]: detail,
          }));
        }
      } catch (error) {
        if (isMounted) {
          setWorkspaceErrorMessage(
            getErrorMessage(error, "Unable to load board details."),
          );
        }
      }
    }

    void loadActiveBoardDetail();
    return () => {
      isMounted = false;
    };
  }, [activeBoardId, setWorkspaceErrorMessage]);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveBoardLists() {
      if (!activeBoardId) {
        return;
      }

      try {
        const lists = await listBoardLists(activeBoardId);
        if (isMounted) {
          setBoardListsById((current) => ({
            ...current,
            [activeBoardId]: lists,
          }));
        }
      } catch (error) {
        if (isMounted) {
          setWorkspaceErrorMessage(
            getErrorMessage(error, "Unable to load board lists."),
          );
        }
      }
    }

    void loadActiveBoardLists();
    return () => {
      isMounted = false;
    };
  }, [activeBoardId, setWorkspaceErrorMessage]);

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
        if (isMounted) {
          setWorkspaceErrorMessage(
            getErrorMessage(error, "Unable to load board cards."),
          );
        }
      }
    }

    void loadActiveBoardCards();
    return () => {
      isMounted = false;
    };
  }, [activeBoardId, activeBoardLists, setWorkspaceErrorMessage]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceDetails() {
      if (!workspaceDetailsWorkspaceId) {
        setWorkspaceDetails(null);
        return;
      }

      try {
        const detail = await getWorkspace(workspaceDetailsWorkspaceId);
        if (isMounted) {
          setWorkspaceDetails(detail);
        }
      } catch {
        if (isMounted) {
          setWorkspaceDetails(null);
        }
      }
    }

    void loadWorkspaceDetails();
    return () => {
      isMounted = false;
    };
  }, [workspaceDetailsWorkspaceId, setWorkspaceDetails]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceActivity() {
      if (!workspaceDetailsWorkspaceId) {
        return;
      }

      try {
        const activity = await getWorkspaceActivity(workspaceDetailsWorkspaceId);
        if (isMounted) {
          setWorkspaceActivityById((current) => ({
            ...current,
            [workspaceDetailsWorkspaceId]: activity,
          }));
        }
      } catch {}
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
        if (isMounted) {
          setBoardCreationWorkspaceDetail(detail);
        }
      } catch {
        if (isMounted) {
          setBoardCreationWorkspaceDetail(null);
        }
      }
    }

    void loadWorkspaceMembersForBoardCreation();
    return () => {
      isMounted = false;
    };
  }, [activeWorkspaceId, isCreateBoardModalOpen, setBoardCreationWorkspaceDetail]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceMembersForBoardManagement() {
      if ((!isBoardMembersModalOpen && !isCreateBoardModalOpen) || !activeWorkspaceId) {
        if (!isBoardMembersModalOpen) {
          setBoardManagementWorkspaceDetail(null);
        }
        return;
      }

      try {
        const detail = await getWorkspace(activeWorkspaceId);
        if (isMounted) {
          setBoardManagementWorkspaceDetail(detail);
        }
      } catch {
        if (isMounted) {
          setBoardManagementWorkspaceDetail(null);
        }
      }
    }

    void loadWorkspaceMembersForBoardManagement();
    return () => {
      isMounted = false;
    };
  }, [
    activeWorkspaceId,
    isBoardMembersModalOpen,
    isCreateBoardModalOpen,
    setBoardManagementWorkspaceDetail,
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
    const refreshedWorkspace = await getWorkspace(workspaceId);
    ui.setWorkspaceDetails(refreshedWorkspace);
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
    ui.setActiveWorkspaceId(workspace.id);
    ui.setIsCreateWorkspaceModalOpen(false);
    ui.setIsWorkspaceMenuOpen(false);
    await refreshWorkspaceActivity(workspace.id);
  }

  async function handleCreateBoard(values: {
    title: string;
    description: string;
    visibility: BoardVisibility;
  }) {
    if (!ui.activeWorkspaceId) {
      throw new Error("Choose a workspace before creating a board.");
    }

    const board = await createBoard({
      workspaceId: ui.activeWorkspaceId,
      title: values.title,
      description: values.description,
      visibility: values.visibility,
    });

    setBoardsByWorkspaceId((current) => ({
      ...current,
      [ui.activeWorkspaceId]: [...(current[ui.activeWorkspaceId] ?? []), board],
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
    ui.setActiveBoardId(board.id);
    await refreshWorkspaceActivity(ui.activeWorkspaceId);

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
    await refreshBoardDetail(input.boardId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleUpdateBoard(input: {
    boardId: string;
    title?: string;
    description?: string;
    visibility?: BoardVisibility;
  }) {
    const updatedBoard = await updateBoardRequest(input);

    if (!ui.activeWorkspaceId) {
      return;
    }

    setBoardsByWorkspaceId((current) => {
      const currentBoards = current[ui.activeWorkspaceId] ?? [];
      return {
        ...current,
        [ui.activeWorkspaceId]: currentBoards.map((board) =>
          board.id === updatedBoard.id ? updatedBoard : board,
        ),
      };
    });

    await refreshBoardDetail(updatedBoard.id);
    await refreshBoardActivity(updatedBoard.id);
    await refreshWorkspaceActivity(ui.activeWorkspaceId);
  }

  async function handleDeleteBoard(input: { boardId: string }) {
    await deleteBoardRequest(input);

    if (!ui.activeWorkspaceId) {
      return;
    }

    setBoardsByWorkspaceId((current) => {
      const currentBoards = current[ui.activeWorkspaceId] ?? [];
      const remainingBoards = currentBoards.filter((board) => board.id !== input.boardId);

      ui.setActiveBoardId((currentActiveBoardId) =>
        currentActiveBoardId === input.boardId
          ? remainingBoards[0]?.id ?? ""
          : currentActiveBoardId,
      );

      return {
        ...current,
        [ui.activeWorkspaceId]: remainingBoards,
      };
    });

    setBoardDetailsById((current) => {
      const next = { ...current };
      delete next[input.boardId];
      return next;
    });
    setBoardActivityById((current) => {
      const next = { ...current };
      delete next[input.boardId];
      return next;
    });
    setBoardListsById((current) => {
      const next = { ...current };
      delete next[input.boardId];
      return next;
    });
    ui.setCardDetailModalState((current) =>
      current?.boardId === input.boardId ? null : current,
    );
    await refreshWorkspaceActivity(ui.activeWorkspaceId);
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

  async function handleDeleteList(input: { boardId: string; listId: string }) {
    await deleteList(input);
    await refreshBoardLists(input.boardId);
    await refreshBoardActivity(input.boardId);
  }

  async function handleReorderList(input: {
    boardId: string;
    listId: string;
    beforeId?: string;
    afterId?: string;
    toIndex: number;
  }) {
    const previousLists = boardListsById[input.boardId] ?? [];
    const orderedLists = getSortedLists(previousLists);
    const fromIndex = orderedLists.findIndex((list) => list.id === input.listId);

    if (fromIndex === -1 || fromIndex === input.toIndex) {
      return;
    }

    const nextLists = renumberLists(moveItem(orderedLists, fromIndex, input.toIndex));

    setBoardListsById((current) => ({
      ...current,
      [input.boardId]: nextLists,
    }));

    try {
      await reorderListRequest(input);
      await refreshBoardActivity(input.boardId);
    } catch (error) {
      setBoardListsById((current) => ({
        ...current,
        [input.boardId]: previousLists,
      }));
      throw error;
    }
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

    const previousCardsByListId = {
      [input.sourceListId]: cardsByListId[input.sourceListId] ?? [],
      [input.targetListId]: cardsByListId[input.targetListId] ?? [],
    };

    if (input.sourceListId === input.targetListId) {
      const fromIndex = sourceCards.findIndex((card) => card.id === input.cardId);

      if (fromIndex === -1 || fromIndex === input.targetIndex) {
        return;
      }

      const nextCards = renumberCards(
        moveItem(sourceCards, fromIndex, input.targetIndex),
        input.sourceListId,
      );

      setCardsByListId((current) => ({
        ...current,
        [input.sourceListId]: nextCards,
      }));

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
        setCardsByListId((current) => ({
          ...current,
          [input.sourceListId]: previousCardsByListId[input.sourceListId],
        }));
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

    setCardsByListId((current) => ({
      ...current,
      [input.sourceListId]: renumberCards(remainingSourceCards, input.sourceListId),
      [input.targetListId]: renumberCards(nextTargetCards, input.targetListId),
    }));

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
        refreshBoardActivity(input.boardId),
        refreshCardDetail({
          boardId: input.boardId,
          listId: input.targetListId,
          cardId: input.cardId,
        }).catch(() => undefined),
      ]);
    } catch (error) {
      setCardsByListId((current) => ({
        ...current,
        [input.sourceListId]: previousCardsByListId[input.sourceListId],
        [input.targetListId]: previousCardsByListId[input.targetListId],
      }));
      throw error;
    }
  }

  async function handleOpenCardDetail(input: CardDetailModalState) {
    await Promise.all([refreshCardDetail(input), refreshCardActivity(input)]);
    ui.setCardDetailModalState(input);
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
    ui.setCardDetailModalState((current) =>
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
    ui.setActiveWorkspaceId(workspace.id);
    ui.setIsJoinWorkspaceModalOpen(false);
    await refreshWorkspaceActivity(workspace.id);
  }

  async function handleUpdateWorkspace(
    workspaceId: string,
    updates: Pick<WorkspaceSummary, "name">,
  ) {
    const updatedWorkspace = await updateWorkspace(workspaceId, updates);

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === workspaceId ? { ...workspace, ...updatedWorkspace } : workspace,
      ),
    );
    ui.setWorkspaceDetails((current) =>
      current && current.id === workspaceId
        ? { ...current, ...updatedWorkspace }
        : current,
    );
    await refreshWorkspaceActivity(workspaceId);
  }

  async function handleDeleteWorkspace(workspaceId: string) {
    await deleteWorkspace(workspaceId);

    setWorkspaces((current) => {
      const remaining = current.filter((workspace) => workspace.id !== workspaceId);

      ui.setActiveWorkspaceId((previous) => {
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

    ui.setWorkspaceDetailsWorkspaceId(null);
    ui.setWorkspaceDetails(null);
    ui.setIsWorkspaceMenuOpen(false);
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

      ui.setActiveWorkspaceId((previous) => {
        if (previous !== workspaceId) {
          return previous;
        }
        return remaining[0]?.id ?? "";
      });

      return remaining;
    });

    ui.setWorkspaceDetailsWorkspaceId(null);
    ui.setWorkspaceDetails(null);
  }

  return {
    accountMenuRef: ui.accountMenuRef,
    activeBoard,
    activeBoardDetail,
    activeBoardLists,
    activeBoards,
    activeWorkspace,
    boardActivityById,
    boardCreationWorkspaceDetail: ui.boardCreationWorkspaceDetail,
    boardManagementWorkspaceDetail: ui.boardManagementWorkspaceDetail,
    cardActivityById,
    cardDetailModalState: ui.cardDetailModalState,
    cardDetailsById,
    cardsByListId,
    createListRequestId: ui.createListRequestId,
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
    isAccountMenuOpen: ui.isAccountMenuOpen,
    isBoardActivityModalOpen: ui.isBoardActivityModalOpen,
    isBoardMembersModalOpen: ui.isBoardMembersModalOpen,
    isBoardSettingsModalOpen: ui.isBoardSettingsModalOpen,
    isCreateBoardModalOpen: ui.isCreateBoardModalOpen,
    isCreateWorkspaceModalOpen: ui.isCreateWorkspaceModalOpen,
    isJoinWorkspaceModalOpen: ui.isJoinWorkspaceModalOpen,
    isSidebarOpen: ui.isSidebarOpen,
    isWorkspaceMenuOpen: ui.isWorkspaceMenuOpen,
    setCardDetailModalState: ui.setCardDetailModalState,
    setCreateListRequestId: ui.setCreateListRequestId,
    setIsAccountMenuOpen: ui.setIsAccountMenuOpen,
    setIsBoardActivityModalOpen: ui.setIsBoardActivityModalOpen,
    setIsBoardMembersModalOpen: ui.setIsBoardMembersModalOpen,
    setIsBoardSettingsModalOpen: ui.setIsBoardSettingsModalOpen,
    setIsCreateBoardModalOpen: ui.setIsCreateBoardModalOpen,
    setIsCreateWorkspaceModalOpen: ui.setIsCreateWorkspaceModalOpen,
    setIsJoinWorkspaceModalOpen: ui.setIsJoinWorkspaceModalOpen,
    setIsSidebarOpen: ui.setIsSidebarOpen,
    setIsWorkspaceMenuOpen: ui.setIsWorkspaceMenuOpen,
    setWorkspaceDetailsWorkspaceId: ui.setWorkspaceDetailsWorkspaceId,
    userInitials,
    workspaceDetails: ui.workspaceDetails,
    workspaceActivityById,
    workspaceErrorMessage: ui.workspaceErrorMessage,
    workspaceMenuRef: ui.workspaceMenuRef,
    workspaces,
    setActiveBoardId: ui.setActiveBoardId,
    setActiveWorkspaceId: ui.setActiveWorkspaceId,
    refreshBoardActivity,
  };
}
