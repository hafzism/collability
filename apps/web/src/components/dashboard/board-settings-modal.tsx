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
  onDeleteBoard: (input: { boardId: string }) => Promise<void>;
  onUpdateBoard: (input: {
    boardId: string;
    title?: string;
    description?: string;
    visibility?: BoardVisibility;
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
  onDeleteBoard,
  onUpdateBoard,
}: BoardSettingsModalProps) {
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description ?? "");
  const [visibility, setVisibility] = useState<BoardVisibility>(board.visibility);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
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
  const formattedVisibility =
    board.visibility === "WORKSPACE" ? "Workspace" : "Private";

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

  async function handleDelete() {
    if (!canManageBoard) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await onDeleteBoard({
        boardId: board.id,
      });
      onClose();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete the board right now.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <DashboardModal
      className={cn("max-w-2xl", !canManageBoard ? "max-w-xl" : "")}
      onClose={onClose}
    >
      <div className="relative">
        <div
          className={cn(
            isConfirmingDelete
              ? "pointer-events-none opacity-30 blur-[1px]"
              : "",
          )}
        >
          <div className="flex items-start justify-between gap-4 pb-5">
            <div>
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
                {canManageBoard ? "Board settings" : "Board details"}
              </h2>
              {canManageBoard ? (
                <p className="mt-2 max-w-xl text-sm text-[#9a9a95]">
                  Update the board title, description, and visibility, or delete
                  it permanently.
                </p>
              ) : null}
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
            {canManageBoard ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[#ecece8]">
                    Title
                  </span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
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
                    className="ui-pressed-active w-full resize-none rounded-[14px] border px-4 py-3 text-sm text-white outline-none transition"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-sm font-medium text-[#ecece8]">
                    Visibility
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["WORKSPACE", "PRIVATE"] as const).map((option) => {
                      const isSelected = visibility === option;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setVisibility(option)}
                          className={cn(
                            "rounded-[14px] border px-4 py-3 text-left transition",
                            isSelected
                              ? "ui-pressed-active text-[#f3f3f0]"
                              : "border-white/8 bg-[#111112] text-[#a0a09a] hover:border-white/12 hover:text-white",
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
              </>
            ) : (
              <div className="space-y-0">
                <section className="border-b border-white/10 pb-5">
                  <p className="text-sm text-[#a5a5a0]">Title</p>
                  <p className="mt-3 text-sm font-semibold text-[#f4f4f1]">
                    {board.title}
                  </p>
                </section>

                <section className="border-b border-white/10 py-5">
                  <p className="text-sm text-[#a5a5a0]">Description</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#f4f4f1]">
                    {board.description?.trim() || "No description"}
                  </p>
                </section>

                <section className="pt-5">
                  <p className="text-sm text-[#a5a5a0]">Visibility</p>
                  <p className="mt-3 text-sm font-semibold text-[#f4f4f1]">
                    {formattedVisibility}
                  </p>
                </section>
              </div>
            )}

            {titleError ? (
              <p className="text-xs text-[#f07f6a]">{titleError}</p>
            ) : null}
            {actionError ? (
              <p className="text-xs text-[#f07f6a]">{actionError}</p>
            ) : null}

            <div
              className={cn(
                "flex items-center gap-3",
                canManageBoard ? "justify-between" : "justify-end",
                canManageBoard ? "border-t border-white/8 pt-5" : "pt-1",
              )}
            >
              {canManageBoard ? (
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setIsConfirmingDelete(true);
                  }}
                  className="ui-pressed-danger rounded-[12px] border px-4 py-2 text-sm font-medium transition"
                >
                  Delete board
                </button>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition"
                >
                  {canManageBoard ? "Cancel" : "Close"}
                </button>
                {canManageBoard ? (
                  <button
                    type="submit"
                    disabled={Boolean(titleError) || !hasChanges || isSaving}
                    className="ui-pressed-primary rounded-[12px] border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </div>

        {isConfirmingDelete ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-full max-w-[340px] rounded-[14px] border border-white/10 bg-[#111112] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <p className="text-sm font-medium text-white">Delete board?</p>
              <p className="mt-2 text-xs leading-5 text-[#a0a09a]">
                Are you sure you want to delete this board? Its lists, cards, and
                members will be removed permanently.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="rounded-[10px] border border-white/10 bg-transparent px-3 py-1.5 text-sm text-white transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                  className="rounded-[10px] border border-[#8f2e2e] bg-[#b93838] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#c54545] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardModal>
  );
}
