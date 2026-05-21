"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  Check,
  Pipette,
  Plus,
  UserPlus,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  BoardLabel,
  BoardMember,
} from "../board-types";
import { getAvatarFallback } from "../workspace-utils";
import { ResizableUnderlineField } from "./resizable-underline-field";
import {
  formatDueDate,
  getSelectedLabels,
  getSelectedMembers,
  getTodayDateString,
  normalizeCardText,
  type CreateBoardLabelHandler,
  type CreateCardHandler,
} from "./kanban-utils";

export function CardDraftComposer({
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
  onCreateBoardLabel: CreateBoardLabelHandler;
  onSubmit: CreateCardHandler;
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
    () => getSelectedLabels(boardLabels, labelIds),
    [boardLabels, labelIds],
  );
  const selectedMembers = useMemo(
    () => getSelectedMembers(boardMembers, assigneeIds),
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
