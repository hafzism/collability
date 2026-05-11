"use client";

import { useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { DashboardModal } from "./dashboard-modal";
import type { BoardDetail, BoardVisibility } from "./board-types";

type BoardSettingsModalProps = {
  board: BoardDetail;
  canManageBoard: boolean;
  onClose: () => void;
  onUpdateBoard: (input: {
    boardId: string;
    title?: string;
    description?: string;
    visibility?: BoardVisibility;
    archived?: boolean;
  }) => Promise<void>;
};

function normalizeBoardText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function validateBoardTitle(value: string) {
  const normalized = normalizeBoardText(value);

  if (!normalized) {
    return "Board title is required.";
  }

  return undefined;
}

export function BoardSettingsModal({
  board,
  canManageBoard,
  onClose,
  onUpdateBoard,
}: BoardSettingsModalProps) {
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description ?? "");
  const [visibility, setVisibility] = useState<BoardVisibility>(board.visibility);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const [archiveConfirmation, setArchiveConfirmation] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const titleError = useMemo(() => validateBoardTitle(title), [title]);
  const normalizedTitle = useMemo(() => normalizeBoardText(title), [title]);
  const normalizedDescription = useMemo(
    () => normalizeBoardText(description),
    [description],
  );
  const hasChanges =
    normalizedTitle !== board.title ||
    normalizedDescription !== (board.description ?? "") ||
    visibility !== board.visibility;
  const canArchive = archiveConfirmation.trim().toLowerCase() === "archive board";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageBoard || titleError || !hasChanges) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      await onUpdateBoard({
        boardId: board.id,
        title: normalizedTitle,
        description: normalizedDescription,
        visibility,
      });
      onClose();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to update board settings right now.",
      );
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    if (!canManageBoard) {
      return;
    }

    setIsArchiving(true);
    setActionError(null);

    try {
      await onUpdateBoard({
        boardId: board.id,
        archived: true,
      });
      onClose();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to archive the board right now.",
      );
      setIsArchiving(false);
    }
  }

  return (
    <DashboardModal className="max-w-2xl" onClose={onClose}>
      <div className="flex items-start justify-between gap-4 pb-5">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
            {canManageBoard ? "Board settings" : "Board details"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#9a9a95]">
            {canManageBoard
              ? "Update the board title, description, visibility, and archive state."
              : "View the current board title, description, visibility, and archive state."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-[12px] p-2 text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#ecece8]">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!canManageBoard}
            className="ui-pressed-active w-full rounded-[14px] border px-4 py-3 text-sm text-white outline-none transition"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#ecece8]">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            disabled={!canManageBoard}
            className="ui-pressed-active w-full resize-none rounded-[14px] border px-4 py-3 text-sm text-white outline-none transition"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-[#ecece8]">Visibility</span>
          <div className="grid grid-cols-2 gap-2">
            {(["WORKSPACE", "PRIVATE"] as const).map((option) => {
              const isSelected = visibility === option;

              return (
                <button
                  key={option}
                  type="button"
                  disabled={!canManageBoard}
                  onClick={() => setVisibility(option)}
                  className={cn(
                    "rounded-[14px] border px-4 py-3 text-left transition",
                    isSelected
                      ? "ui-pressed-active text-[#f3f3f0]"
                      : "border-white/8 bg-[#111112] text-[#a0a09a] hover:border-white/12 hover:text-white",
                    !canManageBoard ? "cursor-default" : "",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">
                      {option === "WORKSPACE" ? "Workspace" : "Private"}
                    </p>
                    {isSelected ? (
                      <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#77d08a]" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-inherit/80">
                    {option === "WORKSPACE"
                      ? "All workspace members can see it in viewer mode unless overridden."
                      : "Only explicit board members can access it, plus workspace owners and admins as viewers."}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {titleError ? <p className="text-xs text-[#f07f6a]">{titleError}</p> : null}
        {actionError ? (
          <p className="text-xs text-[#f07f6a]">{actionError}</p>
        ) : null}

        {canManageBoard && isConfirmingArchive ? (
          <div className="space-y-3 rounded-[14px] border border-[#5f201b] bg-[#26110f] p-4">
            <p className="text-sm font-medium text-[#ffd6cf]">Archive board?</p>
            <p className="text-xs leading-5 text-[#e2b2aa]">
              Archiving will hide this board from the regular workspace view and
              keep its lists, cards, members, and activity in an archived state.
            </p>
            <div className="flex gap-3">
              <input
                value={archiveConfirmation}
                onChange={(event) => setArchiveConfirmation(event.target.value)}
                placeholder='Type "archive board"'
                className="ui-pressed-active min-w-0 flex-1 rounded-[12px] border px-4 py-3 text-sm text-white outline-none transition"
              />
              <button
                type="button"
                onClick={() => void handleArchive()}
                disabled={!canArchive || isArchiving}
                className="ui-pressed-danger min-w-[124px] rounded-[12px] border px-5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isArchiving ? "Archiving..." : "Archive"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setArchiveConfirmation("");
                setIsConfirmingArchive(false);
              }}
              className="text-xs text-[#b98b84] transition hover:text-[#f2c6be]"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-5">
          {canManageBoard ? (
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setArchiveConfirmation("");
                setIsConfirmingArchive(true);
              }}
              className="ui-pressed-danger rounded-[12px] border px-4 py-2 text-sm font-medium transition"
            >
              Archive board
            </button>
          ) : (
            <span className="text-xs text-[#8f8f89]">
              Visibility: {board.visibility.toLowerCase()}
            </span>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition"
            >
              Cancel
            </button>
            <button
              type={canManageBoard ? "submit" : "button"}
              onClick={!canManageBoard ? onClose : undefined}
              disabled={
                canManageBoard
                  ? Boolean(titleError) || !hasChanges || isSaving
                  : false
              }
              className="ui-pressed-primary rounded-[12px] border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canManageBoard
                ? isSaving
                  ? "Saving..."
                  : "Save changes"
                : "Done"}
            </button>
          </div>
        </div>
      </form>
    </DashboardModal>
  );
}
