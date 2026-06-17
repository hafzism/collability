"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type CollisionDetection,
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Check, MoreVertical, Plus, X } from "lucide-react";

import type { BoardPresenceSnapshot } from "@/lib/board-presence";
import { getCardPresenceSummary } from "@/lib/board-presence";
import type {
  BoardCard,
  BoardLabel,
  BoardList,
  BoardMember,
} from "./board-types";
import { CardDraftComposer } from "./kanban/card-draft-composer";
import { BoardCardBody, SortableCardItem } from "./kanban/kanban-card";
import {
  type ActiveDrag,
  type CardsByListId,
  type DraftCard,
  TOUCH_DRAG_DELAY,
  areCardsByListEqual,
  areListOrdersEqual,
  findCardListId,
  getCardItemId,
  getCardNeighbors,
  getListItemId,
  isInteractiveTarget,
  moveArrayItem,
  normalizeCardsByListId,
  normalizeListTitle,
  renumberLists,
  renumberCards,
  sortListsByPosition,
} from "./kanban/kanban-utils";
import {
  ListDropZone,
  ListOverlay,
  SortableListColumn,
} from "./kanban/list-overlay";

type DashboardKanbanProps = {
  activeBoardId: string;
  boardPresence: BoardPresenceSnapshot | null;
  boardLabels: BoardLabel[];
  boardMembers: BoardMember[];
  canManageCards: boolean;
  canManageLists: boolean;
  cardsByListId: Record<string, BoardCard[]>;
  createListRequestId: number;
  currentUserId: string;
  lists: BoardList[];
  onDeleteList: (input: { boardId: string; listId: string }) => Promise<void>;
  onCreateBoardLabel: (input: {
    boardId: string;
    name: string;
    color: string;
  }) => Promise<BoardLabel | void>;
  onCreateCard: (input: {
    boardId: string;
    listId: string;
    title: string;
    description?: string;
    dueDate?: string;
    labelIds?: string[];
    assigneeIds?: string[];
    position: "top" | "bottom";
  }) => Promise<void>;
  onCreateList: (input: { boardId: string; title: string }) => Promise<void>;
  onMoveCard: (input: {
    boardId: string;
    cardId: string;
    sourceListId: string;
    targetListId: string;
    beforeId?: string;
    afterId?: string;
    targetIndex: number;
  }) => Promise<void>;
  onOpenCardComments: (input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) => void;
  onOpenCardDetails: (input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) => void;
  onReorderList: (input: {
    boardId: string;
    listId: string;
    beforeId?: string;
    afterId?: string;
    toIndex: number;
  }) => Promise<void>;
  onRenameList: (input: {
    boardId: string;
    listId: string;
    title: string;
  }) => Promise<void>;
};

class BoardMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: "onMouseDown" as const,
      handler: ({ nativeEvent }: { nativeEvent: MouseEvent }) =>
        !isInteractiveTarget(nativeEvent.target),
    },
  ];
}

class BoardTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent }: { nativeEvent: TouchEvent }) =>
        !isInteractiveTarget(nativeEvent.target),
    },
  ];
}

function ListColumn({
  activeBoardId,
  boardPresence,
  boardLabels,
  boardMembers,
  canManageCards,
  canManageLists,
  cardDraft,
  cards,
  column,
  confirmDeleteListId,
  currentUserId,
  editingListId,
  editingTitle,
  isDraggingCard,
  isPending,
  menuOpen,
  onCancelDraft,
  onCancelRename,
  onChangeEditingTitle,
  onConfirmDelete,
  onCreateBoardLabel,
  onCreateCard,
  onDeleteList,
  onOpenCardComments,
  onOpenCardDetails,
  onOpenMenu,
  onRenameStart,
  onRenameSubmit,
  onShowDeleteConfirm,
  onShowNewCardDraft,
  pendingListId,
  renameInputRef,
}: {
  activeBoardId: string;
  boardPresence: BoardPresenceSnapshot | null;
  boardLabels: BoardLabel[];
  boardMembers: BoardMember[];
  canManageCards: boolean;
  canManageLists: boolean;
  cardDraft: DraftCard | null | undefined;
  cards: BoardCard[];
  column: BoardList;
  confirmDeleteListId: string | null;
  currentUserId: string;
  editingListId: string | null;
  editingTitle: string;
  isDraggingCard: boolean;
  isPending: boolean;
  menuOpen: boolean;
  onCancelDraft: (listId: string) => void;
  onCancelRename: (title: string) => void;
  onChangeEditingTitle: (value: string) => void;
  onConfirmDelete: (listId: string) => Promise<void>;
  onCreateBoardLabel: DashboardKanbanProps["onCreateBoardLabel"];
  onCreateCard: DashboardKanbanProps["onCreateCard"];
  onDeleteList: (listId: string) => void;
  onOpenCardComments: DashboardKanbanProps["onOpenCardComments"];
  onOpenCardDetails: DashboardKanbanProps["onOpenCardDetails"];
  onOpenMenu: () => void;
  onRenameStart: (listId: string, title: string) => void;
  onRenameSubmit: (listId: string) => Promise<void>;
  onShowDeleteConfirm: (listId: string) => void;
  onShowNewCardDraft: (listId: string, position: "top" | "bottom") => void;
  pendingListId: string | null;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <SortableListColumn
      column={column}
      canManageLists={canManageLists}
      isDraggingCard={isDraggingCard}
    >
      <section className="ui-pressed-active flex h-full max-h-full min-h-[220px] flex-col overflow-visible rounded-[20px] border">
        <header className="sticky top-0 z-[1] flex shrink-0 items-center justify-between bg-transparent px-4 py-3.5">
          {editingListId === column.id ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <input
                data-no-dnd="true"
                ref={renameInputRef}
                value={editingTitle}
                onChange={(event) => onChangeEditingTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void onRenameSubmit(column.id);
                  }

                  if (event.key === "Escape") {
                    onCancelRename(column.title);
                  }
                }}
                className="h-9 min-w-0 flex-1 border-b border-white/12 bg-transparent px-0 text-[14px] font-medium text-[#f2f2ef] outline-none transition focus:border-white/25"
              />
              <button
                data-no-dnd="true"
                type="button"
                onClick={() => void onRenameSubmit(column.id)}
                disabled={isPending}
                className="rounded-[10px] p-2 text-[#d4d4cf] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Save ${column.title}`}
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                data-no-dnd="true"
                type="button"
                onClick={() => onCancelRename(column.title)}
                className="rounded-[10px] p-2 text-[#8a8a84] transition hover:bg-white/5 hover:text-white"
                aria-label={`Cancel renaming ${column.title}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <h3 className="truncate pr-3 text-[16px] font-semibold tracking-[-0.015em] text-[#f2f2ef]">
                {column.title}
              </h3>

              <div className="flex items-center gap-1">
                {canManageCards ? (
                  <button
                    data-no-dnd="true"
                    type="button"
                    onClick={() => onShowNewCardDraft(column.id, "top")}
                    aria-label={`Create card at top of ${column.title}`}
                    className="rounded-md p-1.5 text-[#727272] transition hover:bg-white/5 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : null}

                {canManageLists ? (
                  <button
                    data-no-dnd="true"
                    type="button"
                    onClick={onOpenMenu}
                    aria-label={`More options for ${column.title}`}
                    className="rounded-md p-1.5 text-[#727272] transition hover:bg-white/5 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </>
          )}
        </header>

        {menuOpen ? (
          <div className="absolute right-3 top-13 z-10 min-w-[174px] rounded-[14px] border border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]">
            {confirmDeleteListId === column.id ? (
              <div className="space-y-3 rounded-[12px] px-3 py-3">
                <div>
                  <p className="text-[13px] font-medium text-[#f2d1cb]">
                    Delete list?
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[#bb8f87]">
                    Are you sure you want to delete this list and all of its
                    cards?
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    data-no-dnd="true"
                    type="button"
                    onClick={() => onDeleteList(column.id)}
                    className="ui-pressed-button rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition"
                  >
                    Cancel
                  </button>
                  <button
                    data-no-dnd="true"
                    type="button"
                    onClick={() => void onConfirmDelete(column.id)}
                    disabled={pendingListId === column.id}
                    className="ui-pressed-danger rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingListId === column.id ? "Deleting" : "Delete"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  data-no-dnd="true"
                  type="button"
                  onClick={() => onRenameStart(column.id, column.title)}
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
                >
                  <span>Rename list</span>
                </button>
                <button
                  data-no-dnd="true"
                  type="button"
                  onClick={() => onShowDeleteConfirm(column.id)}
                  className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#f0b3a8] transition hover:bg-[#2b1512] hover:text-[#ffd5cd]"
                >
                  <span>Delete list</span>
                </button>
              </>
            )}
          </div>
        ) : null}

        <div className="scrollbar-hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4 pt-1">
          <ListDropZone listId={column.id} isCardDragActive={isDraggingCard}>
            <div className="flex min-h-full flex-col">
              <div className="space-y-3">
                {cardDraft?.position === "top" ? (
                  <CardDraftComposer
                    boardId={activeBoardId}
                    listId={column.id}
                    boardLabels={boardLabels}
                    boardMembers={boardMembers}
                    onCreateBoardLabel={onCreateBoardLabel}
                    onSubmit={onCreateCard}
                    onCancel={() => onCancelDraft(column.id)}
                    position="top"
                  />
                ) : null}

                <SortableContext
                  items={cards.map((card) => getCardItemId(card.id))}
                  strategy={verticalListSortingStrategy}
                >
                  {cards.map((card) => (
                    <SortableCardItem
                      key={card.id}
                      boardId={activeBoardId}
                      card={card}
                      currentUserId={currentUserId}
                      canManageCards={canManageCards}
                      onOpenComments={onOpenCardComments}
                      onOpenDetails={onOpenCardDetails}
                      presence={getCardPresenceSummary(
                        boardPresence,
                        card.id,
                        currentUserId,
                      )}
                    />
                  ))}
                </SortableContext>

                {cardDraft?.position === "bottom" ? (
                  <CardDraftComposer
                    boardId={activeBoardId}
                    listId={column.id}
                    boardLabels={boardLabels}
                    boardMembers={boardMembers}
                    onCreateBoardLabel={onCreateBoardLabel}
                    onSubmit={onCreateCard}
                    onCancel={() => onCancelDraft(column.id)}
                    position="bottom"
                  />
                ) : null}
              </div>

              <div aria-hidden="true" className="min-h-16 flex-1" />

              {canManageCards ? (
                <button
                  data-no-dnd="true"
                  type="button"
                  onClick={() => onShowNewCardDraft(column.id, "bottom")}
                  className="mt-2 flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-[#747470] transition hover:text-[#d7d7d3]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New card</span>
                </button>
              ) : null}
            </div>
          </ListDropZone>
        </div>
      </section>
    </SortableListColumn>
  );
}

export function DashboardKanban({
  activeBoardId,
  boardPresence,
  boardLabels,
  boardMembers,
  canManageCards,
  canManageLists,
  cardsByListId,
  createListRequestId,
  currentUserId,
  lists,
  onDeleteList,
  onCreateBoardLabel,
  onCreateCard,
  onCreateList,
  onMoveCard,
  onOpenCardComments,
  onOpenCardDetails,
  onReorderList,
  onRenameList,
}: DashboardKanbanProps) {
  const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<string | null>(
    null,
  );
  const [pendingListId, setPendingListId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [draftsByListId, setDraftsByListId] = useState<
    Record<string, DraftCard | null>
  >({});
  const [orderedLists, setOrderedLists] = useState<BoardList[]>(() =>
    sortListsByPosition(lists),
  );
  const [orderedCardsByListId, setOrderedCardsByListId] =
    useState<CardsByListId>(() =>
      normalizeCardsByListId(sortListsByPosition(lists), cardsByListId),
    );
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const createListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const dragSnapshotRef = useRef<{
    lists: BoardList[];
    cardsByListId: CardsByListId;
  } | null>(null);
  const lastCardOverRef = useRef<string | null>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);
  const sortedLists = useMemo(() => sortListsByPosition(lists), [lists]);
  const sensors = useSensors(
    useSensor(BoardMouseSensor),
    useSensor(BoardTouchSensor, {
      activationConstraint: {
        delay: TOUCH_DRAG_DELAY,
        tolerance: 8,
      },
    }),
  );
  const activeCard = useMemo(() => {
    if (activeDrag?.type !== "card") {
      return null;
    }

    const currentListId = findCardListId(
      orderedCardsByListId,
      activeDrag.cardId,
    );
    if (!currentListId) {
      return null;
    }

    return (
      orderedCardsByListId[currentListId]?.find(
        (card) => card.id === activeDrag.cardId,
      ) ?? null
    );
  }, [activeDrag, orderedCardsByListId]);
  const activeList = useMemo(
    () =>
      activeDrag?.type === "list"
        ? (orderedLists.find((list) => list.id === activeDrag.listId) ?? null)
        : null,
    [activeDrag, orderedLists],
  );
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      const findCollisionByType = (type: "card" | "list-drop" | "list") =>
        pointerCollisions.find((collision) => {
          const container = args.droppableContainers.find(
            (droppable) => droppable.id === collision.id,
          );

          return container?.data.current?.type === type;
        });

      const prioritizedCollision =
        findCollisionByType("card") ??
        findCollisionByType("list-drop") ??
        findCollisionByType("list");

      if (prioritizedCollision) {
        return [prioritizedCollision];
      }

      return pointerCollisions;
    }

    return closestCenter(args);
  }, []);

  useEffect(() => {
    activeDragRef.current = activeDrag;
  }, [activeDrag]);

  useEffect(() => {
    if (activeDragRef.current) {
      return;
    }

    const nextLists = sortListsByPosition(lists);
    const nextCardsByListId = normalizeCardsByListId(nextLists, cardsByListId);

    setOrderedLists((current) =>
      areListOrdersEqual(current, nextLists) ? current : nextLists,
    );
    setOrderedCardsByListId((current) =>
      areCardsByListEqual(
        current,
        nextCardsByListId,
        nextLists.map((list) => list.id),
      )
        ? current
        : nextCardsByListId,
    );
  }, [cardsByListId, lists]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenColumnMenuId(null);
        setConfirmDeleteListId(null);
      }

      if (
        creatingList &&
        createListRef.current &&
        !createListRef.current.contains(target)
      ) {
        setCreatingList(false);
        setNewListTitle("");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [creatingList]);

  useEffect(() => {
    if (!canManageLists || !activeBoardId || createListRequestId === 0) {
      return;
    }

    openCreateListDraft();
  }, [activeBoardId, canManageLists, createListRequestId]);

  useEffect(() => {
    if (creatingList) {
      inputRef.current?.focus();
    }
  }, [creatingList]);

  useEffect(() => {
    if (editingListId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [editingListId]);

  useEffect(() => {
    setCreatingList(false);
    setNewListTitle("");
    setEditingListId(null);
    setEditingTitle("");
    setOpenColumnMenuId(null);
    setConfirmDeleteListId(null);
    setListError(null);
    setDraftsByListId({});
    setOrderedLists(sortListsByPosition(lists));
    setOrderedCardsByListId(
      normalizeCardsByListId(sortListsByPosition(lists), cardsByListId),
    );
    setActiveDrag(null);
    dragSnapshotRef.current = null;
    lastCardOverRef.current = null;
  }, [activeBoardId, cardsByListId, lists]);

  function openCreateListDraft() {
    setCreatingList(true);
    setNewListTitle("");
    setEditingListId(null);
    setOpenColumnMenuId(null);
    setConfirmDeleteListId(null);
    setListError(null);
  }

  function clearCardDraft(listId: string) {
    setDraftsByListId((current) => ({
      ...current,
      [listId]: null,
    }));
  }

  function openCardDraft(listId: string, position: "top" | "bottom") {
    setDraftsByListId((current) => ({
      ...current,
      [listId]: { position },
    }));
  }

  function startRename(listId: string, title: string) {
    setEditingListId(listId);
    setEditingTitle(title);
    setOpenColumnMenuId(null);
  }

  function cancelRename(title: string) {
    setEditingListId(null);
    setEditingTitle(title);
  }

  async function handleCreateListSubmit() {
    const title = normalizeListTitle(newListTitle);
    if (!title || !activeBoardId) {
      return;
    }

    setPendingListId("__new__");
    setListError(null);

    try {
      await onCreateList({
        boardId: activeBoardId,
        title,
      });
      setCreatingList(false);
      setNewListTitle("");
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to create list right now.",
      );
    } finally {
      setPendingListId(null);
    }
  }

  async function handleRenameSubmit(listId: string) {
    const title = normalizeListTitle(editingTitle);
    const currentList = sortedLists.find((list) => list.id === listId);

    if (!currentList) {
      return;
    }

    if (!title) {
      setEditingTitle(currentList.title);
      setEditingListId(null);
      return;
    }

    if (title === currentList.title) {
      setEditingListId(null);
      return;
    }

    setPendingListId(listId);
    setListError(null);

    try {
      await onRenameList({
        boardId: activeBoardId,
        listId,
        title,
      });
      setEditingListId(null);
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to rename list right now.",
      );
    } finally {
      setPendingListId(null);
    }
  }

  async function handleDeleteListSubmit(listId: string) {
    setPendingListId(listId);
    setListError(null);

    try {
      await onDeleteList({
        boardId: activeBoardId,
        listId,
      });
      setOpenColumnMenuId(null);
      setConfirmDeleteListId(null);
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to delete list right now.",
      );
    } finally {
      setPendingListId(null);
    }
  }

  function resetDraggedState() {
    const snapshot = dragSnapshotRef.current;
    if (snapshot) {
      setOrderedLists(snapshot.lists);
      setOrderedCardsByListId(snapshot.cardsByListId);
    }
    dragSnapshotRef.current = null;
    lastCardOverRef.current = null;
    setActiveDrag(null);
  }

  function handleDragStart(event: DragStartEvent) {
    const type = event.active.data.current?.type;
    if (type === "list" && !canManageLists) {
      return;
    }

    dragSnapshotRef.current = {
      lists: orderedLists,
      cardsByListId: orderedCardsByListId,
    };

    if (type === "card") {
      lastCardOverRef.current = null;
      setActiveDrag({
        type: "card",
        cardId: event.active.data.current?.cardId as string,
        sourceListId: event.active.data.current?.listId as string,
      });
      return;
    }

    if (type === "list") {
      setActiveDrag({
        type: "list",
        listId: event.active.data.current?.listId as string,
      });
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (activeDrag?.type !== "card") {
      return;
    }

    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    const overData = event.over.data.current;
    if (!overData) {
      return;
    }

    const targetListId =
      overData.type === "card"
        ? (overData.listId as string)
        : overData.type === "list-drop"
          ? (overData.listId as string)
          : null;

    if (!targetListId) {
      return;
    }

    const currentListId = findCardListId(
      orderedCardsByListId,
      activeDrag.cardId,
    );
    if (!currentListId || currentListId === targetListId) {
      return;
    }

    const currentCards = [...(orderedCardsByListId[currentListId] ?? [])];
    const sourceIndex = currentCards.findIndex(
      (card) => card.id === activeDrag.cardId,
    );
    if (sourceIndex === -1) {
      return;
    }

    const sourceCards = [...currentCards];
    const targetCards = [...(orderedCardsByListId[targetListId] ?? [])];
    const [movingCard] = sourceCards.splice(sourceIndex, 1);
    let targetIndex =
      overData.type === "card"
        ? targetCards.findIndex(
            (card) => card.id === (overData.cardId as string),
          )
        : targetCards.length;

    if (targetIndex === -1) {
      targetIndex = targetCards.length;
    }

    const nextHoverKey = `${currentListId}:${targetListId}:${targetIndex}:${activeDrag.cardId}`;
    if (lastCardOverRef.current === nextHoverKey) {
      return;
    }

    targetCards.splice(targetIndex, 0, {
      ...movingCard,
      listId: targetListId,
    });

    const nextSourceCards = renumberCards(sourceCards, currentListId);
    const nextTargetCards = renumberCards(targetCards, targetListId);

    if (
      nextSourceCards.length ===
        (orderedCardsByListId[currentListId] ?? []).length &&
      nextTargetCards.length ===
        (orderedCardsByListId[targetListId] ?? []).length &&
      nextSourceCards.every(
        (card, index) =>
          card.id === orderedCardsByListId[currentListId]?.[index]?.id,
      ) &&
      nextTargetCards.every(
        (card, index) =>
          card.id === orderedCardsByListId[targetListId]?.[index]?.id,
      )
    ) {
      return;
    }

    lastCardOverRef.current = nextHoverKey;
    setOrderedCardsByListId((current) => ({
      ...current,
      [currentListId]: nextSourceCards,
      [targetListId]: nextTargetCards,
    }));
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!activeDrag) {
      return;
    }

    const snapshot = dragSnapshotRef.current;
    if (!event.over || !snapshot) {
      resetDraggedState();
      return;
    }

    if (activeDrag.type === "list") {
      if (!canManageLists) {
        resetDraggedState();
        return;
      }

      const overType = event.over.data.current?.type;
      const overListId =
        overType === "list" || overType === "card" || overType === "list-drop"
          ? (event.over.data.current?.listId as string)
          : null;

      if (!overListId || overListId === activeDrag.listId) {
        dragSnapshotRef.current = null;
        lastCardOverRef.current = null;
        setActiveDrag(null);
        return;
      }

      const fromIndex = orderedLists.findIndex(
        (list) => list.id === activeDrag.listId,
      );
      const toIndex = orderedLists.findIndex((list) => list.id === overListId);

      if (fromIndex === -1 || toIndex === -1) {
        resetDraggedState();
        return;
      }

      const nextLists = renumberLists(
        moveArrayItem(orderedLists, fromIndex, toIndex),
      );
      const beforeId = toIndex > 0 ? nextLists[toIndex - 1]?.id : undefined;
      const afterId =
        toIndex < nextLists.length - 1 ? nextLists[toIndex + 1]?.id : undefined;

      setOrderedLists(nextLists);
      dragSnapshotRef.current = null;
      lastCardOverRef.current = null;
      setActiveDrag(null);

      try {
        await onReorderList({
          boardId: activeBoardId,
          listId: activeDrag.listId,
          beforeId,
          afterId,
          toIndex,
        });
      } catch (error) {
        setListError(
          error instanceof Error
            ? error.message
            : "Unable to reorder list right now.",
        );
        setOrderedLists(snapshot.lists);
      }

      return;
    }

    const overData = event.over.data.current;
    const targetListId =
      overData?.type === "card" || overData?.type === "list-drop"
        ? (overData.listId as string)
        : findCardListId(orderedCardsByListId, activeDrag.cardId);

    if (!targetListId) {
      resetDraggedState();
      return;
    }

    const targetCards = orderedCardsByListId[targetListId] ?? [];
    const sourceCardsBefore =
      snapshot.cardsByListId[activeDrag.sourceListId] ?? [];
    const sourceIndexBefore = sourceCardsBefore.findIndex(
      (card) => card.id === activeDrag.cardId,
    );
    let targetIndex =
      overData?.type === "card"
        ? targetCards.findIndex(
            (card) => card.id === (overData.cardId as string),
          )
        : overData?.type === "list-drop"
          ? targetCards.length
          : targetCards.findIndex((card) => card.id === activeDrag.cardId);

    if (activeDrag.sourceListId === targetListId) {
      if (!overData) {
        resetDraggedState();
        return;
      }

      targetIndex =
        overData.type === "card"
          ? sourceCardsBefore.findIndex(
              (card) => card.id === (overData.cardId as string),
            )
          : sourceCardsBefore.length - 1;

      if (targetIndex === -1) {
        targetIndex = sourceIndexBefore;
      }

      if (sourceIndexBefore === targetIndex) {
        dragSnapshotRef.current = null;
        lastCardOverRef.current = null;
        setActiveDrag(null);
        return;
      }

      const reorderedCards = moveArrayItem(
        sourceCardsBefore,
        sourceIndexBefore,
        targetIndex,
      );
      const { beforeId, afterId } = getCardNeighbors(
        reorderedCards,
        targetIndex,
      );
      const nextOrderedCards = renumberCards(reorderedCards, targetListId);

      setOrderedCardsByListId((current) => ({
        ...current,
        [targetListId]: nextOrderedCards,
      }));

      dragSnapshotRef.current = null;
      lastCardOverRef.current = null;
      setActiveDrag(null);

      try {
        await onMoveCard({
          boardId: activeBoardId,
          cardId: activeDrag.cardId,
          sourceListId: activeDrag.sourceListId,
          targetListId,
          beforeId,
          afterId,
          targetIndex,
        });
      } catch (error) {
        setListError(
          error instanceof Error
            ? error.message
            : "Unable to move card right now.",
        );
        setOrderedCardsByListId(snapshot.cardsByListId);
      }

      return;
    }

    if (targetIndex === -1) {
      targetIndex = targetCards.length;
    }

    const { beforeId, afterId } = getCardNeighbors(targetCards, targetIndex);

    dragSnapshotRef.current = null;
    lastCardOverRef.current = null;
    setActiveDrag(null);

    try {
      await onMoveCard({
        boardId: activeBoardId,
        cardId: activeDrag.cardId,
        sourceListId: activeDrag.sourceListId,
        targetListId,
        beforeId,
        afterId,
        targetIndex,
      });
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Unable to move card right now.",
      );
      setOrderedCardsByListId(snapshot.cardsByListId);
    }
  }

  if (!activeBoardId) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="ui-pressed-active rounded-[20px] border border-dashed px-8 py-12 text-center">
          <p className="text-sm font-medium text-[#e6e6e2]">Choose a board</p>
          <p className="mt-2 text-sm text-[#8f8f89]">
            Select a board from the sidebar to start organizing lists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(event) => void handleDragEnd(event)}
      onDragCancel={resetDraggedState}
    >
      <div className="scrollbar-hidden h-full min-h-0 w-full max-w-full overflow-x-auto overflow-y-hidden px-4 pb-0 pt-3">
        <SortableContext
          items={orderedLists.map((list) => getListItemId(list.id))}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex h-full min-h-0 min-w-max items-stretch gap-4 pr-4">
            {orderedLists.map((column) => (
              <div
                key={column.id}
                ref={openColumnMenuId === column.id ? menuRef : undefined}
              >
                <ListColumn
                  activeBoardId={activeBoardId}
                  boardPresence={boardPresence}
                  boardLabels={boardLabels}
                  boardMembers={boardMembers}
                  canManageCards={canManageCards}
                  canManageLists={canManageLists}
                  cardDraft={draftsByListId[column.id]}
                  cards={orderedCardsByListId[column.id] ?? []}
                  column={column}
                  confirmDeleteListId={confirmDeleteListId}
                  currentUserId={currentUserId}
                  editingListId={editingListId}
                  editingTitle={editingTitle}
                  isDraggingCard={activeDrag?.type === "card"}
                  isPending={pendingListId === column.id}
                  menuOpen={openColumnMenuId === column.id}
                  onCancelDraft={clearCardDraft}
                  onCancelRename={cancelRename}
                  onChangeEditingTitle={setEditingTitle}
                  onConfirmDelete={handleDeleteListSubmit}
                  onCreateBoardLabel={onCreateBoardLabel}
                  onCreateCard={onCreateCard}
                  onDeleteList={() => {
                    setConfirmDeleteListId(null);
                    setOpenColumnMenuId(null);
                  }}
                  onOpenCardComments={onOpenCardComments}
                  onOpenCardDetails={onOpenCardDetails}
                  onOpenMenu={() =>
                    setOpenColumnMenuId((currentValue) =>
                      currentValue === column.id ? null : column.id,
                    )
                  }
                  onRenameStart={startRename}
                  onRenameSubmit={handleRenameSubmit}
                  onShowDeleteConfirm={setConfirmDeleteListId}
                  onShowNewCardDraft={openCardDraft}
                  pendingListId={pendingListId}
                  renameInputRef={renameInputRef}
                />
              </div>
            ))}

            {canManageLists && !creatingList ? (
              <div className="relative h-full min-h-0 w-[296px] shrink-0 self-start">
                <button
                  data-no-dnd="true"
                  type="button"
                  onClick={openCreateListDraft}
                  className="ui-pressed-active flex h-auto min-h-[72px] w-full items-center justify-start gap-2 rounded-[20px] border border-dashed px-4 py-4 text-left text-[13px] font-medium text-[#d7d7d3] transition hover:text-white"
                >
                  <Plus className="h-4 w-4 text-[#8a8a84]" />
                  <span>New list</span>
                </button>
              </div>
            ) : null}

            {canManageLists && creatingList ? (
              <div
                ref={createListRef}
                className="relative h-full min-h-0 w-[296px] shrink-0 self-start"
              >
                <section className="ui-pressed-active flex max-h-full min-h-[220px] flex-col overflow-hidden rounded-[20px] border">
                  <div className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <input
                        data-no-dnd="true"
                        ref={inputRef}
                        value={newListTitle}
                        onChange={(event) =>
                          setNewListTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleCreateListSubmit();
                          }

                          if (event.key === "Escape") {
                            setCreatingList(false);
                            setNewListTitle("");
                          }
                        }}
                        placeholder="New list"
                        className="h-9 min-w-0 flex-1 border-b border-white/12 bg-transparent px-0 text-[14px] font-medium text-[#f2f2ef] outline-none transition placeholder:text-[#70706b] focus:border-white/25"
                      />
                      <button
                        data-no-dnd="true"
                        type="button"
                        onClick={() => void handleCreateListSubmit()}
                        disabled={
                          !normalizeListTitle(newListTitle) ||
                          pendingListId === "__new__"
                        }
                        className="rounded-[10px] p-2 text-[#d4d4cf] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Save new list"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        data-no-dnd="true"
                        type="button"
                        onClick={() => {
                          setCreatingList(false);
                          setNewListTitle("");
                        }}
                        className="rounded-[10px] p-2 text-[#8a8a84] transition hover:bg-white/5 hover:text-white"
                        aria-label="Cancel new list"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="min-h-[146px] flex-1 px-3 pb-4" />
                </section>
              </div>
            ) : null}
          </div>
        </SortableContext>

        {listError ? (
          <p className="px-1 pt-3 text-sm text-[#f07f6a]">{listError}</p>
        ) : null}
      </div>

      <DragOverlay>
        {activeDrag?.type === "card" && activeCard ? (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.03, rotate: -1 }}
          >
            <BoardCardBody
              boardId={activeBoardId}
              card={activeCard}
              currentUserId={currentUserId}
              onOpenComments={onOpenCardComments}
              onOpenDetails={onOpenCardDetails}
              className="w-[272px] shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
            />
          </motion.div>
        ) : null}

        {activeDrag?.type === "list" && activeList ? (
          <ListOverlay
            title={activeList.title}
            cardCount={orderedCardsByListId[activeList.id]?.length ?? 0}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
