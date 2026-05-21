"use client";

import {
  CalendarDays,
  Info,
  MessageSquareText,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

import type { BoardCard } from "../board-types";
import { getAvatarFallback } from "../workspace-utils";
import {
  formatDueDate,
  getCardItemId,
  type CardActionHandler,
} from "./kanban-utils";

export function BoardCardBody({
  boardId,
  card,
  onOpenComments,
  onOpenDetails,
  className,
}: {
  boardId: string;
  card: BoardCard;
  onOpenComments: CardActionHandler;
  onOpenDetails: CardActionHandler;
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

export function SortableCardItem({
  boardId,
  card,
  canManageCards,
  onOpenComments,
  onOpenDetails,
}: {
  boardId: string;
  card: BoardCard;
  canManageCards: boolean;
  onOpenComments: CardActionHandler;
  onOpenDetails: CardActionHandler;
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
