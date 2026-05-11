"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Check,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";

import type { BoardList } from "./board-types";
import { cn } from "@/lib/utils";

type DashboardKanbanProps = {
  activeBoardId: string;
  canManageLists: boolean;
  createListRequestId: number;
  lists: BoardList[];
  onArchiveList: (input: { boardId: string; listId: string }) => Promise<void>;
  onCreateList: (input: { boardId: string; title: string }) => Promise<void>;
  onRenameList: (input: {
    boardId: string;
    listId: string;
    title: string;
  }) => Promise<void>;
};

function normalizeListTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function DashboardKanban({
  activeBoardId,
  canManageLists,
  createListRequestId,
  lists,
  onArchiveList,
  onCreateList,
  onRenameList,
}: DashboardKanbanProps) {
  const [openColumnMenuId, setOpenColumnMenuId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [confirmArchiveListId, setConfirmArchiveListId] = useState<string | null>(
    null,
  );
  const [pendingListId, setPendingListId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const createListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const sortedLists = useMemo(
    () =>
      [...lists].sort((left, right) => Number(left.position) - Number(right.position)),
    [lists],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenColumnMenuId(null);
        setConfirmArchiveListId(null);
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

    setCreatingList(true);
    setNewListTitle("");
    setEditingListId(null);
    setOpenColumnMenuId(null);
    setConfirmArchiveListId(null);
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
    setConfirmArchiveListId(null);
    setListError(null);
  }, [activeBoardId]);

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
        error instanceof Error ? error.message : "Unable to create list right now.",
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
        error instanceof Error ? error.message : "Unable to rename list right now.",
      );
    } finally {
      setPendingListId(null);
    }
  }

  async function handleArchiveListSubmit(listId: string) {
    setPendingListId(listId);
    setListError(null);

    try {
      await onArchiveList({
        boardId: activeBoardId,
        listId,
      });
      setOpenColumnMenuId(null);
      setConfirmArchiveListId(null);
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : "Unable to archive list right now.",
      );
    } finally {
      setPendingListId(null);
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
    <div className="scrollbar-hidden h-full min-h-0 w-full max-w-full overflow-x-auto overflow-y-hidden px-4 pb-0 pt-3">
      <div className="flex h-full min-h-0 min-w-max items-start gap-4 pr-4">
        {sortedLists.map((column) => (
          <div
            key={column.id}
            className="relative h-full min-h-0 w-[296px] shrink-0 self-start"
            ref={openColumnMenuId === column.id ? menuRef : null}
          >
            <section className="ui-pressed-active flex max-h-full min-h-[220px] flex-col self-start overflow-hidden rounded-[20px] border">
              <header className="sticky top-0 z-[1] flex shrink-0 items-center justify-between bg-transparent px-4 py-3.5">
                {editingListId === column.id ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      ref={renameInputRef}
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleRenameSubmit(column.id);
                        }

                        if (event.key === "Escape") {
                          setEditingListId(null);
                          setEditingTitle(column.title);
                        }
                      }}
                      className="h-9 min-w-0 flex-1 border-b border-white/12 bg-transparent px-0 text-[14px] font-medium text-[#f2f2ef] outline-none transition focus:border-white/25"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRenameSubmit(column.id)}
                      disabled={pendingListId === column.id}
                      className="rounded-[10px] p-2 text-[#d4d4cf] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Save ${column.title}`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingListId(null);
                        setEditingTitle(column.title);
                      }}
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

                    {canManageLists ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenColumnMenuId((currentValue) =>
                            currentValue === column.id ? null : column.id,
                          )
                        }
                        aria-label={`More options for ${column.title}`}
                        className="rounded-md p-1.5 text-[#727272] transition hover:bg-white/5 hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    ) : null}
                  </>
                )}
              </header>

              {openColumnMenuId === column.id ? (
                <div className="absolute right-3 top-13 z-10 min-w-[174px] rounded-[14px] border border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]">
                  {confirmArchiveListId === column.id ? (
                    <div className="space-y-3 rounded-[12px] px-3 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-[#f2d1cb]">
                          Archive list?
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-[#bb8f87]">
                          Cards stay intact, but this list will leave the active board view.
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmArchiveListId(null)}
                          className="ui-pressed-button rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleArchiveListSubmit(column.id)}
                          disabled={pendingListId === column.id}
                          className="ui-pressed-danger rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pendingListId === column.id ? "Archiving" : "Archive"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingListId(column.id);
                          setEditingTitle(column.title);
                          setOpenColumnMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#d9d9d6] transition hover:bg-white/6 hover:text-white"
                      >
                        <span>Rename list</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmArchiveListId(column.id)}
                        className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] text-[#f0b3a8] transition hover:bg-[#2b1512] hover:text-[#ffd5cd]"
                      >
                        <span>Archive list</span>
                      </button>
                    </>
                  )}
                </div>
              ) : null}

              <div className="scrollbar-hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4 pt-1">
                <div className="flex min-h-full flex-col">
                  <div className="ui-pressed-active flex min-h-[132px] items-center justify-center rounded-[18px] border border-dashed border-white/7 bg-[linear-gradient(180deg,rgba(18,18,19,0.95)_0%,rgba(13,13,14,0.95)_100%)] px-6 text-center">
                    <div>
                      <p className="text-sm font-medium text-[#deded9]">
                        No cards yet
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#868680]">
                        Cards will show up here once the card flow is wired for this board.
                      </p>
                    </div>
                  </div>

                  <div aria-hidden="true" className="min-h-16 flex-1" />

                  <button
                    type="button"
                    disabled
                    className="mt-2 flex w-full items-center justify-center gap-2 px-3 py-2 text-[12px] font-medium text-[#5f5f5b] transition disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add card</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        ))}

        {canManageLists && creatingList ? (
          <div
            ref={createListRef}
            className="relative h-full min-h-0 w-[296px] shrink-0 self-start"
          >
            <section className="ui-pressed-active flex max-h-full min-h-[220px] flex-col overflow-hidden rounded-[20px] border">
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={newListTitle}
                    onChange={(event) => setNewListTitle(event.target.value)}
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
                    type="button"
                    onClick={() => void handleCreateListSubmit()}
                    disabled={!normalizeListTitle(newListTitle) || pendingListId === "__new__"}
                    className={cn(
                      "rounded-[10px] p-2 text-[#d4d4cf] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                    aria-label="Save new list"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
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
      {listError ? <p className="px-1 pt-3 text-sm text-[#f07f6a]">{listError}</p> : null}
    </div>
  );
}
