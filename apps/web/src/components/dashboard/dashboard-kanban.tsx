"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

import {
  CalendarDays,
  Check,
  Info,
  MessageSquareText,
  MoreVertical,
  Pipette,
  Plus,
  UserPlus,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  BoardCard,
  BoardLabel,
  BoardList,
  BoardMember,
} from "./board-types";
import { getAvatarFallback } from "./workspace-utils";

type DashboardKanbanProps = {
  activeBoardId: string;
  boardLabels: BoardLabel[];
  boardMembers: BoardMember[];
  canManageCards: boolean;
  canManageLists: boolean;
  cardsByListId: Record<string, BoardCard[]>;
  createListRequestId: number;
  lists: BoardList[];
  onArchiveList: (input: { boardId: string; listId: string }) => Promise<void>;
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

type DraftCard = {
  position: "top" | "bottom";
};

type CardsByListId = Record<string, BoardCard[]>;

type ActiveDrag =
  | {
      type: "card";
      cardId: string;
      sourceListId: string;
    }
  | {
      type: "list";
      listId: string;
    };

const LIST_ITEM_PREFIX = "list:";
const LIST_DROP_PREFIX = "list-drop:";
const CARD_ITEM_PREFIX = "card:";
const TOUCH_DRAG_DELAY = 300;

function sortListsByPosition(items: BoardList[]) {
  return [...items].sort((left, right) => Number(left.position) - Number(right.position));
}

function sortCardsByPosition(items: BoardCard[]) {
  return [...items].sort((left, right) => Number(left.position) - Number(right.position));
}

function normalizeCardsByListId(
  lists: BoardList[],
  cardsByListId: CardsByListId,
): CardsByListId {
  return Object.fromEntries(
    lists.map((list) => [list.id, sortCardsByPosition(cardsByListId[list.id] ?? [])]),
  );
}

function renumberCards(cards: BoardCard[], listId: string) {
  return cards.map((card, index) => ({
    ...card,
    listId,
    position: `${(index + 1) * 1000}`,
  }));
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function areCardOrdersEqual(left: BoardCard[], right: BoardCard[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((card, index) => card.id === right[index]?.id);
}

function getCardItemId(cardId: string) {
  return `${CARD_ITEM_PREFIX}${cardId}`;
}

function getListItemId(listId: string) {
  return `${LIST_ITEM_PREFIX}${listId}`;
}

function getListDropId(listId: string) {
  return `${LIST_DROP_PREFIX}${listId}`;
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-no-dnd='true']"))
  );
}

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

function getCardNeighbors(cards: BoardCard[], targetIndex: number) {
  return {
    beforeId: targetIndex > 0 ? cards[targetIndex - 1]?.id : undefined,
    afterId:
      targetIndex < cards.length - 1 ? cards[targetIndex + 1]?.id : undefined,
  };
}

function findCardListId(cardsByListId: CardsByListId, cardId: string) {
  for (const [listId, cards] of Object.entries(cardsByListId)) {
    if (cards.some((card) => card.id === cardId)) {
      return listId;
    }
  }

  return null;
}

function normalizeListTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeCardText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function formatDueDate(value: string | null) {
  if (!value) {
    return "Due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ResizableUnderlineField({
  value,
  onChange,
  placeholder,
  className,
  minRows = 1,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.max(
      textareaRef.current.scrollHeight,
      minRows * 24,
    )}px`;
  }, [minRows, value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={minRows}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full resize-none overflow-hidden border-b border-white/12 bg-transparent px-0 py-0 text-left outline-none transition placeholder:text-[#6f6f6a] focus:border-white/25",
        className,
      )}
    />
  );
}

function CardDraftComposer({
  boardId,
  listId,
  boardLabels,
  boardMembers,
  onCreateBoardLabel,
  onSubmit,
  onCancel,
  position,
}: {
  boardId: string;
  listId: string;
  boardLabels: BoardLabel[];
  boardMembers: BoardMember[];
  onCreateBoardLabel: (input: {
    boardId: string;
    name: string;
    color: string;
  }) => Promise<BoardLabel | void>;
  onSubmit: (input: {
    boardId: string;
    listId: string;
    title: string;
    description?: string;
    dueDate?: string;
    labelIds?: string[];
    assigneeIds?: string[];
    position: "top" | "bottom";
  }) => Promise<void>;
  onCancel: () => void;
  position: "top" | "bottom";
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [openPopover, setOpenPopover] = useState<"labels" | "assignees" | "date" | null>(
    null,
  );
  const [creatingLabelName, setCreatingLabelName] = useState("");
  const [creatingLabelColor, setCreatingLabelColor] = useState<string>("#ffffff");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelTriggerRef = useRef<HTMLButtonElement | null>(null);
  const assigneeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dateTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const selectedLabels = useMemo(
    () => boardLabels.filter((label) => labelIds.includes(label.id)),
    [boardLabels, labelIds],
  );
  const selectedMembers = useMemo(
    () => boardMembers.filter((member) => assigneeIds.includes(member.userId)),
    [assigneeIds, boardMembers],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsidePopover =
        popoverRef.current && popoverRef.current.contains(target);
      const clickedInsideCard =
        containerRef.current && containerRef.current.contains(target);

      if (openPopover && !clickedInsidePopover) {
        setOpenPopover(null);
      }

      if (!clickedInsideCard && !isSaving) {
        setIsShaking(true);
        window.setTimeout(() => setIsShaking(false), 280);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isSaving, openPopover]);

  useEffect(() => {
    if (openPopover === "date" && dateInputRef.current) {
      dateInputRef.current.focus();
      if ("showPicker" in dateInputRef.current) {
        try {
          dateInputRef.current.showPicker();
        } catch {}
      }
    }
  }, [openPopover]);

  async function handleCreateLabel() {
    const normalizedName = normalizeCardText(creatingLabelName);
    if (!normalizedName) {
      return;
    }

    setIsCreatingLabel(true);
    setError(null);

    try {
      const createdLabel = await onCreateBoardLabel({
        boardId,
        name: normalizedName,
        color: creatingLabelColor,
      });

      if (createdLabel) {
        setLabelIds((current) => [...current, createdLabel.id]);
      }

      setCreatingLabelName("");
      setOpenPopover("labels");
    } catch (labelError) {
      setError(
        labelError instanceof Error
          ? labelError.message
          : "Unable to create label right now.",
      );
    } finally {
      setIsCreatingLabel(false);
    }
  }

  async function handleSubmit() {
    const normalizedTitle = normalizeCardText(title);
    const normalizedDescription = normalizeCardText(description);

    if (!normalizedTitle) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSubmit({
        boardId,
        listId,
        title: normalizedTitle,
        description: normalizedDescription || undefined,
        dueDate: dueDate || undefined,
        labelIds,
        assigneeIds,
        position,
      });
      onCancel();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create card right now.",
      );
      setIsSaving(false);
    }
  }

  return (
    <div
      data-no-dnd="true"
      ref={containerRef}
      className={cn(
        "relative rounded-[20px] border border-white/7 bg-[linear-gradient(180deg,#1a1a1b_0%,#141415_100%)] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.03)] ring-1 ring-white/[0.02]",
        isShaking ? "[animation:card-draft-shake_0.28s_ease-in-out]" : "",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {selectedLabels.map((label) => (
          <span
            key={label.id}
            className="inline-flex rounded-full border px-1.75 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em]"
            style={{
              borderColor: `${label.color}55`,
              backgroundColor: `${label.color}1a`,
              color: label.color,
            }}
          >
            {label.name}
          </span>
        ))}

        <button
          ref={labelTriggerRef}
          type="button"
          onClick={() => setOpenPopover("labels")}
          className={cn(
            "rounded-full border border-white/8 px-2 py-0.75 text-[9px] font-medium uppercase tracking-[0.14em] text-[#bcbcb8] transition hover:border-white/14 hover:text-white",
            selectedLabels.length > 0 ? "min-w-6 px-1.75" : "",
          )}
        >
          {selectedLabels.length > 0 ? "+" : "+ Label"}
        </button>
      </div>

      {openPopover === "labels" ? (
        <div
          ref={popoverRef}
          className="fixed z-30 w-[252px] rounded-[16px] border border-white/8 bg-[#121213] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.5)]"
          style={{
            top: (labelTriggerRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
            left: labelTriggerRef.current?.getBoundingClientRect().left ?? 0,
          }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8f8f89]">
            Labels
          </p>
          <div className="mt-3 max-h-[180px] space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
            {boardLabels.map((label) => {
              const isSelected = labelIds.includes(label.id);

              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() =>
                    setLabelIds((current) =>
                      isSelected
                        ? current.filter((id) => id !== label.id)
                        : [...current, label.id],
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-sm transition",
                    isSelected
                      ? "ui-pressed-active text-white"
                      : "text-[#c9c9c4] hover:bg-white/6 hover:text-white",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 truncate">{label.name}</span>
                  {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-3 border-t border-white/8 pt-3">
            <div className="flex items-center gap-3">
              <input
                value={creatingLabelName}
                onChange={(event) => setCreatingLabelName(event.target.value)}
                placeholder="New label"
                className="h-9 min-w-0 flex-1 border-b border-white/12 bg-transparent px-0 text-sm text-white outline-none placeholder:text-[#6c6c67]"
              />
              <label
                className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 transition hover:border-white/20"
                style={{ backgroundColor: creatingLabelColor }}
              >
                <Pipette className="h-3.5 w-3.5 text-black/75" />
                <input
                  type="color"
                  value={creatingLabelColor}
                  onChange={(event) => setCreatingLabelColor(event.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Choose label color"
                />
              </label>
            </div>
            {normalizeCardText(creatingLabelName) ? (
              <button
                type="button"
                onClick={() => void handleCreateLabel()}
                disabled={isCreatingLabel}
                className="ui-pressed-button mt-3 rounded-[10px] border px-3 py-1.5 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingLabel ? "Creating..." : "Create label"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <ResizableUnderlineField
          value={title}
          onChange={setTitle}
          placeholder="Card title"
          className="text-[15px] font-medium leading-6 text-[#f2f2ef]"
        />
      </div>

      <div className="mt-3">
        <ResizableUnderlineField
          value={description}
          onChange={setDescription}
          placeholder="Description"
          className="text-[13px] leading-6 text-[#bdbdb8]"
          minRows={1}
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="relative flex min-w-0 flex-1 items-center gap-2">
          <div className="flex -space-x-1.5">
            {selectedMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() =>
                  setAssigneeIds((current) =>
                    current.filter((userId) => userId !== member.userId),
                  )
                }
                title={`Remove ${member.user.name}`}
                className="group relative flex h-6 w-6 items-center justify-center rounded-full border border-[#121213] bg-[#d66c12] text-[9px] font-semibold text-white"
              >
                <span className="group-hover:opacity-0">
                  {getAvatarFallback(member.user.name)}
                </span>
                <X className="absolute h-3 w-3 opacity-0 transition group-hover:opacity-100" />
              </button>
            ))}
          </div>

          <button
            ref={assigneeTriggerRef}
            type="button"
            onClick={() => setOpenPopover("assignees")}
            className={cn(
              "flex items-center justify-center rounded-full border border-white/8 text-[#c2c2bd] transition hover:border-white/14 hover:text-white",
              selectedMembers.length > 0 ? "h-6 w-6" : "h-7 gap-1.5 px-2.5 text-[11px]",
            )}
          >
            {selectedMembers.length > 0 ? (
              <Plus className="h-3.5 w-3.5" />
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                <span>Assignees</span>
              </>
            )}
          </button>

          {openPopover === "assignees" ? (
            <div
              ref={popoverRef}
              className="fixed z-30 w-[190px] rounded-[16px] border border-white/8 bg-[#121213] p-2 shadow-[0_24px_50px_rgba(0,0,0,0.5)]"
              style={{
                top: (assigneeTriggerRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
                left: assigneeTriggerRef.current?.getBoundingClientRect().left ?? 0,
              }}
            >
              <div className="max-h-[128px] overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
                {boardMembers.map((member) => {
                  const isSelected = assigneeIds.includes(member.userId);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        setAssigneeIds((current) =>
                          isSelected
                            ? current.filter((userId) => userId !== member.userId)
                            : [...current, member.userId],
                        )
                      }
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left transition",
                        isSelected
                          ? "bg-white/6 text-white"
                          : "text-[#c9c9c4] hover:bg-white/4 hover:text-white",
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d66c12] text-[9px] font-semibold text-white">
                        {getAvatarFallback(member.user.name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px]">
                        {member.user.name}
                      </span>
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative shrink-0">
          <button
            ref={dateTriggerRef}
            type="button"
            onClick={() => setOpenPopover("date")}
            className="inline-flex items-center gap-1 rounded-full border border-white/8 px-2 py-1 text-[10px] text-[#8a8a87] transition hover:border-white/14 hover:text-white"
          >
            <CalendarDays className="h-2.5 w-2.5" />
            {formatDueDate(dueDate || null)}
          </button>

          {openPopover === "date" ? (
            <div
              ref={popoverRef}
              className="fixed z-30 w-[186px] rounded-[16px] border border-white/8 bg-[#121213] p-2.5 shadow-[0_24px_50px_rgba(0,0,0,0.5)]"
              style={{
                top: (dateTriggerRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
                left:
                  (dateTriggerRef.current?.getBoundingClientRect().right ?? 186) - 186,
              }}
            >
              <input
                ref={dateInputRef}
                type="date"
                value={dueDate}
                min={getTodayDateString()}
                onChange={(event) => {
                  setDueDate(event.target.value);
                  setOpenPopover(null);
                }}
                className="h-10 w-full rounded-[12px] border border-white/10 bg-[#161617] px-3 text-sm text-white outline-none"
              />
            </div>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-3 text-xs text-[#f07f6a]">{error}</p> : null}

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[10px] p-2 text-[#8a8a84] transition hover:bg-white/5 hover:text-white"
          aria-label="Cancel card draft"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!normalizeCardText(title) || isSaving}
          className="rounded-[10px] p-2 text-[#d4d4cf] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Save card"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes card-draft-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}

function BoardCardBody({
  boardId,
  card,
  onOpenComments,
  onOpenDetails,
  className,
}: {
  boardId: string;
  card: BoardCard;
  onOpenComments: (input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) => void;
  onOpenDetails: (input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-white/7 bg-[linear-gradient(180deg,#1a1a1b_0%,#141415_100%)] p-4 text-left shadow-[0_14px_34px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.03)] ring-1 ring-white/[0.02]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {card.labels.map(({ id, label }) => (
            <span
              key={id}
              className="inline-flex rounded-full border px-1.75 py-0.5 text-[8px] font-medium uppercase tracking-[0.12em]"
              style={{
                borderColor: `${label.color}55`,
                backgroundColor: `${label.color}1a`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            data-no-dnd="true"
            type="button"
            onClick={() =>
              onOpenDetails({
                boardId,
                listId: card.listId,
                cardId: card.id,
              })
            }
            className="rounded-[9px] p-1.5 text-[#7f7f7a] transition hover:bg-white/6 hover:text-white"
            aria-label={`Open details for ${card.title}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <h4 className="mt-3 text-[14px] font-medium leading-5 text-[#f2f2f0]">
        {card.title}
      </h4>

      {card.description ? (
        <p className="mt-2 line-clamp-3 text-[12px] leading-5 text-[#a6a6a1]">
          {card.description}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex -space-x-1.5">
          {card.assignees.map((assignee) => (
            <span
              key={assignee.id}
              title={assignee.user.name}
              className="flex h-5.5 w-5.5 items-center justify-center rounded-full border border-[#121213] bg-[#d66c12] text-[8px] font-semibold text-white"
            >
              {getAvatarFallback(assignee.user.name)}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#8a8a87]">
          {card._count.comments > 0 ? (
            <button
              data-no-dnd="true"
              type="button"
              onClick={() =>
                onOpenComments({
                  boardId,
                  listId: card.listId,
                  cardId: card.id,
                })
              }
              className="inline-flex items-center gap-1 rounded-full border border-white/6 bg-black/20 px-1.75 py-0.5 transition hover:border-white/10 hover:text-white"
              aria-label={`Open comments for ${card.title}`}
            >
              <MessageSquareText className="h-2.5 w-2.5" />
              {card._count.comments}
            </button>
          ) : null}
          {card.dueDate ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/6 bg-black/20 px-1.75 py-0.5">
              <CalendarDays className="h-2.5 w-2.5" />
              {formatDueDate(card.dueDate)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SortableCardItem({
  boardId,
  card,
  canManageCards,
  onOpenComments,
  onOpenDetails,
}: {
  boardId: string;
  card: BoardCard;
  canManageCards: boolean;
  onOpenComments: (input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) => void;
  onOpenDetails: (input: {
    boardId: string;
    listId: string;
    cardId: string;
  }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: getCardItemId(card.id),
      disabled: !canManageCards,
      data: {
        type: "card",
        cardId: card.id,
        listId: card.listId,
      },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "transition-[opacity,transform] duration-200",
        isDragging ? "opacity-35" : "",
      )}
      {...attributes}
      {...listeners}
    >
      <BoardCardBody
        boardId={boardId}
        card={card}
        onOpenComments={onOpenComments}
        onOpenDetails={onOpenDetails}
        className={cn(
          "transition-[transform,box-shadow] duration-200",
          canManageCards ? "cursor-grab active:cursor-grabbing" : "",
        )}
      />
    </div>
  );
}

function SortableListColumn({
  children,
  column,
  canManageLists,
  isDraggingCard,
}: {
  children: ReactNode;
  column: BoardList;
  canManageLists: boolean;
  isDraggingCard: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: getListItemId(column.id),
      disabled: !canManageLists,
      data: {
        type: "list",
        listId: column.id,
      },
    });

  return (
    <div
      ref={setNodeRef}
      className="relative min-h-0 w-[296px] shrink-0 self-start"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "transition-opacity duration-200",
          canManageLists && !isDraggingCard ? "cursor-grab active:cursor-grabbing" : "",
          isDragging ? "opacity-40" : "",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ListDropZone({
  listId,
  children,
  isCardDragActive,
}: {
  listId: string;
  children: ReactNode;
  isCardDragActive: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: getListDropId(listId),
    data: {
      type: "list-drop",
      listId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-full flex-col rounded-[18px] transition-colors duration-200",
        isCardDragActive && isOver ? "bg-white/[0.03]" : "",
      )}
    >
      {children}
    </div>
  );
}

function ListOverlay({
  title,
  cardCount,
}: {
  title: string;
  cardCount: number;
}) {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: 1.02, rotate: -1 }}
      className="ui-pressed-active flex w-[296px] min-h-[220px] flex-col rounded-[20px] border opacity-95 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"
    >
      <header className="flex shrink-0 items-center justify-between px-4 py-3.5">
        <h3 className="truncate pr-3 text-[16px] font-semibold tracking-[-0.015em] text-[#f2f2ef]">
          {title}
        </h3>
        <span className="rounded-full border border-white/8 px-2 py-1 text-[10px] text-[#8f8f89]">
          {cardCount} cards
        </span>
      </header>
      <div className="flex flex-1 items-end px-4 pb-4 pt-1">
        <p className="text-[12px] text-[#8f8f89]">Drop here</p>
      </div>
    </motion.div>
  );
}

export function DashboardKanban({
  activeBoardId,
  boardLabels,
  boardMembers,
  canManageCards,
  canManageLists,
  cardsByListId,
  createListRequestId,
  lists,
  onArchiveList,
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
  const [confirmArchiveListId, setConfirmArchiveListId] = useState<string | null>(
    null,
  );
  const [pendingListId, setPendingListId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [draftsByListId, setDraftsByListId] = useState<Record<string, DraftCard | null>>(
    {},
  );
  const [orderedLists, setOrderedLists] = useState<BoardList[]>(() =>
    sortListsByPosition(lists),
  );
  const [orderedCardsByListId, setOrderedCardsByListId] = useState<CardsByListId>(
    () => normalizeCardsByListId(sortListsByPosition(lists), cardsByListId),
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

    const currentListId = findCardListId(orderedCardsByListId, activeDrag.cardId);
    if (!currentListId) {
      return null;
    }

    return (
      orderedCardsByListId[currentListId]?.find((card) => card.id === activeDrag.cardId) ??
      null
    );
  }, [activeDrag, orderedCardsByListId]);
  const activeList = useMemo(
    () =>
      activeDrag?.type === "list"
        ? orderedLists.find((list) => list.id === activeDrag.listId) ?? null
        : null,
    [activeDrag, orderedLists],
  );

  useEffect(() => {
    if (activeDrag) {
      return;
    }

    const nextLists = sortListsByPosition(lists);
    setOrderedLists(nextLists);
    setOrderedCardsByListId(normalizeCardsByListId(nextLists, cardsByListId));
  }, [activeDrag, cardsByListId, lists]);

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
    setConfirmArchiveListId(null);
    setListError(null);
    setDraftsByListId({});
    setOrderedLists(sortListsByPosition(lists));
    setOrderedCardsByListId(normalizeCardsByListId(sortListsByPosition(lists), cardsByListId));
    setActiveDrag(null);
    dragSnapshotRef.current = null;
  }, [activeBoardId, cardsByListId, lists]);

  function openCreateListDraft() {
    setCreatingList(true);
    setNewListTitle("");
    setEditingListId(null);
    setOpenColumnMenuId(null);
    setConfirmArchiveListId(null);
    setListError(null);
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

    const overData = event.over?.data.current;
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

    const currentListId = findCardListId(orderedCardsByListId, activeDrag.cardId);
    if (!currentListId) {
      return;
    }

    const currentCards = [...(orderedCardsByListId[currentListId] ?? [])];
    const sourceIndex = currentCards.findIndex((card) => card.id === activeDrag.cardId);
    if (sourceIndex === -1) {
      return;
    }

    if (currentListId === targetListId) {
      const nextCards = [...currentCards];
      const [movingCard] = nextCards.splice(sourceIndex, 1);
      let targetIndex =
        overData.type === "card"
          ? nextCards.findIndex((card) => card.id === (overData.cardId as string))
          : nextCards.length;

      if (targetIndex === -1) {
        targetIndex = nextCards.length;
      }

      const nextHoverKey = `${currentListId}:${targetIndex}:${activeDrag.cardId}`;
      if (lastCardOverRef.current === nextHoverKey) {
        return;
      }

      nextCards.splice(targetIndex, 0, movingCard);

      const reorderedCards = renumberCards(nextCards, currentListId);
      if (areCardOrdersEqual(reorderedCards, currentCards)) {
        return;
      }

      lastCardOverRef.current = nextHoverKey;
      setOrderedCardsByListId((current) => ({
        ...current,
        [currentListId]: reorderedCards,
      }));
      return;
    }

    const sourceCards = [...currentCards];
    const targetCards = [...(orderedCardsByListId[targetListId] ?? [])];
    const [movingCard] = sourceCards.splice(sourceIndex, 1);
    let targetIndex =
      overData.type === "card"
        ? targetCards.findIndex((card) => card.id === (overData.cardId as string))
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
      areCardOrdersEqual(nextSourceCards, orderedCardsByListId[currentListId] ?? []) &&
      areCardOrdersEqual(nextTargetCards, orderedCardsByListId[targetListId] ?? [])
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

      const fromIndex = orderedLists.findIndex((list) => list.id === activeDrag.listId);
      const toIndex = orderedLists.findIndex((list) => list.id === overListId);

      if (fromIndex === -1 || toIndex === -1) {
        resetDraggedState();
        return;
      }

      const nextLists = moveArrayItem(orderedLists, fromIndex, toIndex).map(
        (list, index) => ({
          ...list,
          position: `${(index + 1) * 1000}`,
        }),
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
          error instanceof Error ? error.message : "Unable to reorder list right now.",
        );
        setOrderedLists(snapshot.lists);
      }

      return;
    }

    const targetListId = findCardListId(orderedCardsByListId, activeDrag.cardId);
    if (!targetListId) {
      resetDraggedState();
      return;
    }

    const targetCards = orderedCardsByListId[targetListId] ?? [];
    const targetIndex = targetCards.findIndex((card) => card.id === activeDrag.cardId);
    const sourceCardsBefore = snapshot.cardsByListId[activeDrag.sourceListId] ?? [];
    const sourceIndexBefore = sourceCardsBefore.findIndex(
      (card) => card.id === activeDrag.cardId,
    );

    if (targetIndex === -1) {
      resetDraggedState();
      return;
    }

    if (
      activeDrag.sourceListId === targetListId &&
      sourceIndexBefore === targetIndex
    ) {
      dragSnapshotRef.current = null;
      lastCardOverRef.current = null;
      setActiveDrag(null);
      return;
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
        error instanceof Error ? error.message : "Unable to move card right now.",
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
      collisionDetection={closestCenter}
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
          <div className="flex h-full min-h-0 min-w-max items-start gap-4 pr-4">
            {orderedLists.map((column) => {
              const cards = orderedCardsByListId[column.id] ?? [];
              const draft = draftsByListId[column.id];

              return (
                <SortableListColumn
                  key={column.id}
                  column={column}
                  canManageLists={canManageLists}
                  isDraggingCard={activeDrag?.type === "card"}
                >
                  <section className="ui-pressed-active flex max-h-full min-h-[220px] flex-col self-start overflow-visible rounded-[20px] border">
                    <header className="sticky top-0 z-[1] flex shrink-0 items-center justify-between bg-transparent px-4 py-3.5">
                      {editingListId === column.id ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <input
                            data-no-dnd="true"
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
                            data-no-dnd="true"
                            type="button"
                            onClick={() => void handleRenameSubmit(column.id)}
                            disabled={pendingListId === column.id}
                            className="rounded-[10px] p-2 text-[#d4d4cf] transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Save ${column.title}`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            data-no-dnd="true"
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

                          <div className="flex items-center gap-1">
                            {canManageCards ? (
                              <button
                                data-no-dnd="true"
                                type="button"
                                onClick={() =>
                                  setDraftsByListId((current) => ({
                                    ...current,
                                    [column.id]: { position: "top" },
                                  }))
                                }
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
                          </div>
                        </>
                      )}
                    </header>

                    {openColumnMenuId === column.id ? (
                      <div
                        ref={menuRef}
                        className="absolute right-3 top-13 z-10 min-w-[174px] rounded-[14px] border border-white/8 bg-[#151515] p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.48)]"
                      >
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
                                data-no-dnd="true"
                                type="button"
                                onClick={() => setConfirmArchiveListId(null)}
                                className="ui-pressed-button rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition"
                              >
                                Cancel
                              </button>
                              <button
                                data-no-dnd="true"
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
                              data-no-dnd="true"
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
                              data-no-dnd="true"
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
                      <ListDropZone
                        listId={column.id}
                        isCardDragActive={activeDrag?.type === "card"}
                      >
                        <div className="flex min-h-full flex-col">
                          <div className="space-y-3">
                            {draft?.position === "top" ? (
                              <CardDraftComposer
                                boardId={activeBoardId}
                                listId={column.id}
                                boardLabels={boardLabels}
                                boardMembers={boardMembers}
                                onCreateBoardLabel={onCreateBoardLabel}
                                onSubmit={onCreateCard}
                                onCancel={() =>
                                  setDraftsByListId((current) => ({
                                    ...current,
                                    [column.id]: null,
                                  }))
                                }
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
                                  canManageCards={canManageCards}
                                  onOpenComments={onOpenCardComments}
                                  onOpenDetails={onOpenCardDetails}
                                />
                              ))}
                            </SortableContext>

                            {draft?.position === "bottom" ? (
                              <CardDraftComposer
                                boardId={activeBoardId}
                                listId={column.id}
                                boardLabels={boardLabels}
                                boardMembers={boardMembers}
                                onCreateBoardLabel={onCreateBoardLabel}
                                onSubmit={onCreateCard}
                                onCancel={() =>
                                  setDraftsByListId((current) => ({
                                    ...current,
                                    [column.id]: null,
                                  }))
                                }
                                position="bottom"
                              />
                            ) : null}
                          </div>

                          <div aria-hidden="true" className="min-h-16 flex-1" />

                          {canManageCards ? (
                            <button
                              data-no-dnd="true"
                              type="button"
                              onClick={() =>
                                setDraftsByListId((current) => ({
                                  ...current,
                                  [column.id]: { position: "bottom" },
                                }))
                              }
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
            })}

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
                        data-no-dnd="true"
                        type="button"
                        onClick={() => void handleCreateListSubmit()}
                        disabled={!normalizeListTitle(newListTitle) || pendingListId === "__new__"}
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

        {listError ? <p className="px-1 pt-3 text-sm text-[#f07f6a]">{listError}</p> : null}
      </div>

      <DragOverlay>
        {activeDrag?.type === "card" && activeCard ? (
          <motion.div initial={{ scale: 1 }} animate={{ scale: 1.03, rotate: -1 }}>
            <BoardCardBody
              boardId={activeBoardId}
              card={activeCard}
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
