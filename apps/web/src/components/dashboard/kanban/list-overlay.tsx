"use client";

import type { ReactNode } from "react";

import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "@/lib/utils";

import type { BoardList } from "../board-types";
import { getListDropId, getListItemId } from "./kanban-utils";

export function SortableListColumn({
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
    <div className="relative h-full min-h-0 w-[296px] shrink-0 self-stretch">
      <div
        ref={setNodeRef}
        className={cn(
          "h-full self-start transition-opacity duration-200",
          canManageLists && !isDraggingCard ? "cursor-grab active:cursor-grabbing" : "",
          isDragging ? "opacity-40" : "",
        )}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        {...attributes}
        {...listeners}
      >
        {children}
      </div>
    </div>
  );
}

export function ListDropZone({
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

export function ListOverlay({
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
