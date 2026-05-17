"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Pencil, Save, X } from "lucide-react";

import { DashboardModal } from "./dashboard-modal";
import type {
  BoardCardActivityItem,
  BoardCardDetail,
  BoardLabel,
  BoardMember,
} from "./board-types";
import { getAvatarFallback } from "./workspace-utils";
import { cn } from "@/lib/utils";

type CardDetailModalProps = {
  activityItems: BoardCardActivityItem[];
  boardLabels: BoardLabel[];
  boardMembers: BoardMember[];
  canArchiveCard: boolean;
  canEditCard: boolean;
  card: BoardCardDetail;
  initialTab?: "details" | "comments";
  onArchiveCard: (input: { cardId: string }) => Promise<void>;
  onClose: () => void;
  onCreateComment: (input: { cardId: string; content: string }) => Promise<void>;
  onUpdateCard: (input: {
    cardId: string;
    title: string;
    description?: string;
    dueDate?: string;
    labelIds?: string[];
    assigneeIds?: string[];
  }) => Promise<void>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function resetCardEditDrafts(input: {
  card: BoardCardDetail;
  setTitleDraft: (value: string) => void;
  setDescriptionDraft: (value: string) => void;
  setDueDateDraft: (value: string) => void;
  setLabelIdsDraft: (value: string[]) => void;
  setAssigneeIdsDraft: (value: string[]) => void;
}) {
  input.setTitleDraft(input.card.title);
  input.setDescriptionDraft(input.card.description ?? "");
  input.setDueDateDraft(input.card.dueDate ? input.card.dueDate.slice(0, 10) : "");
  input.setLabelIdsDraft(input.card.labels.map(({ labelId }) => labelId));
  input.setAssigneeIdsDraft(input.card.assignees.map((assignee) => assignee.userId));
}

export function CardDetailModal({
  activityItems,
  boardLabels,
  boardMembers,
  canArchiveCard,
  canEditCard,
  card,
  initialTab = "details",
  onArchiveCard,
  onClose,
  onCreateComment,
  onUpdateCard,
}: CardDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "comments">(initialTab);
  const [comment, setComment] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState(card.description ?? "");
  const [dueDateDraft, setDueDateDraft] = useState(
    card.dueDate ? card.dueDate.slice(0, 10) : "",
  );
  const [isArchiveSubmitting, setIsArchiveSubmitting] = useState(false);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [labelIdsDraft, setLabelIdsDraft] = useState<string[]>(
    card.labels.map(({ labelId }) => labelId),
  );
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [assigneeIdsDraft, setAssigneeIdsDraft] = useState<string[]>(
    card.assignees.map((assignee) => assignee.userId),
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const commentCount = useMemo(() => card.comments.length, [card.comments.length]);

  useEffect(() => {
    resetCardEditDrafts({
      card,
      setTitleDraft,
      setDescriptionDraft,
      setDueDateDraft,
      setLabelIdsDraft,
      setAssigneeIdsDraft,
    });
    setIsEditing(false);
    setIsConfirmingArchive(false);
    setActionError(null);
  }, [card]);

  async function handleSubmitComment() {
    const normalized = comment.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return;
    }

    setIsSubmittingComment(true);
    setActionError(null);

    try {
      await onCreateComment({
        cardId: card.id,
        content: normalized,
      });
      setComment("");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to add comment right now.",
      );
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleSaveEdits() {
    const normalizedTitle = titleDraft.trim().replace(/\s+/g, " ");
    if (!normalizedTitle) {
      setActionError("Card title is required.");
      return;
    }

    setIsSubmittingEdit(true);
    setActionError(null);

    try {
      await onUpdateCard({
        cardId: card.id,
        title: normalizedTitle,
        description: descriptionDraft.trim() || undefined,
        dueDate: dueDateDraft || undefined,
        labelIds: labelIdsDraft,
        assigneeIds: assigneeIdsDraft,
      });
      setIsEditing(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to update card right now.",
      );
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  async function handleArchive() {
    setIsArchiveSubmitting(true);
    setActionError(null);

    try {
      await onArchiveCard({ cardId: card.id });
      onClose();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to archive card right now.",
      );
      setIsArchiveSubmitting(false);
    }
  }

  return (
    <DashboardModal className="max-w-[470px] p-3" onClose={onClose}>
      <div className="relative">
        <div className={cn(isConfirmingArchive ? "pointer-events-none opacity-30 blur-[1px]" : "")}>
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-semibold text-[#f5f5f3]">
                {card.title}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#8f8f89]">{card.list.title}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] p-2 text-[#9a9a95] transition hover:bg-white/6 hover:text-white"
              aria-label="Close card details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3 border-b border-white/8 pb-2">
            <div className="flex gap-2">
              {(["details", "comments"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-[10px] px-3 py-1.5 text-[12px] font-medium transition",
                    activeTab === tab
                      ? "ui-pressed-active text-white"
                      : "text-[#9a9a95] hover:bg-white/6 hover:text-white",
                  )}
                >
                  {tab === "details" ? "Details" : `Comments ${commentCount ? `(${commentCount})` : ""}`}
                </button>
              ))}
            </div>
            {canArchiveCard ? (
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setIsConfirmingArchive(true);
                }}
                className="rounded-[10px] px-2.5 py-1.5 text-[11px] font-medium text-[#f07f6a] transition hover:bg-[#321714]"
              >
                Archive card
              </button>
            ) : null}
          </div>

          {activeTab === "details" ? (
            <div className="mt-2.5 flex h-[430px] flex-col gap-2">
          <div className="ui-pressed-active rounded-[12px] border px-2.5 py-2.5">
            <div className="space-y-1.5 text-[12px] leading-5 text-[#d2d2cd]">
              {isEditing ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Title</span>
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <input
                        value={titleDraft}
                        onChange={(event) => setTitleDraft(event.target.value)}
                        className="h-6 min-w-0 flex-1 border-b border-white/12 bg-transparent px-0 text-[12px] text-white outline-none placeholder:text-[#6f6f6a] focus:border-white/25"
                      />
                      {canEditCard ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              resetCardEditDrafts({
                                card,
                                setTitleDraft,
                                setDescriptionDraft,
                                setDueDateDraft,
                                setLabelIdsDraft,
                                setAssigneeIdsDraft,
                              });
                              setIsEditing(false);
                              setActionError(null);
                            }}
                            className="rounded-[9px] p-1.5 text-[#8f8f89] transition hover:bg-white/6 hover:text-white"
                            aria-label="Cancel card edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSaveEdits()}
                            disabled={isSubmittingEdit}
                            className="rounded-[9px] p-1.5 text-[#d4d4cf] transition hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Save card changes"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Description</span>
                    <textarea
                      value={descriptionDraft}
                      onChange={(event) => setDescriptionDraft(event.target.value)}
                      rows={2}
                      className="min-h-[2.5rem] min-w-0 flex-1 resize-none border-b border-white/12 bg-transparent px-0 py-0 text-[12px] text-white outline-none placeholder:text-[#6f6f6a] focus:border-white/25"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Due date</span>
                    <input
                      type="date"
                      value={dueDateDraft}
                      onChange={(event) => setDueDateDraft(event.target.value)}
                      className="h-6 min-w-0 flex-1 border-b border-white/12 bg-transparent px-0 text-[12px] text-white outline-none focus:border-white/25"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Assignees</span>
                    <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                      {boardMembers.map((member) => {
                        const isSelected = assigneeIdsDraft.includes(member.userId);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() =>
                              setAssigneeIdsDraft((current) =>
                                isSelected
                                  ? current.filter((id) => id !== member.userId)
                                  : [...current, member.userId],
                              )
                            }
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] transition",
                              isSelected
                                ? "border-white/18 bg-white/8 text-white"
                                : "border-white/8 text-[#a9a9a5] hover:border-white/14 hover:text-white",
                            )}
                          >
                            {member.user.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Created</span>
                    <p className="min-w-0 flex-1">
                      <span className="text-[#ecece8]">{card.creator.name}</span>{" "}
                      <span className="text-[#7f7f7a]">at</span>{" "}
                      <span className="text-[#ecece8]">{formatDateTime(card.createdAt)}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Labels</span>
                    <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                      {boardLabels.map((label) => {
                        const isSelected = labelIdsDraft.includes(label.id);
                        return (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() =>
                              setLabelIdsDraft((current) =>
                                isSelected
                                  ? current.filter((id) => id !== label.id)
                                  : [...current, label.id],
                              )
                            }
                            className="inline-flex rounded-full border px-1.75 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] transition"
                            style={{
                              borderColor: isSelected ? `${label.color}88` : `${label.color}40`,
                              backgroundColor: isSelected ? `${label.color}26` : "transparent",
                              color: label.color,
                            }}
                          >
                            {label.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Title</span>
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <p className="min-w-0 flex-1 text-[#ecece8]">{card.title}</p>
                      {canEditCard ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="rounded-[9px] p-1.5 text-[#8f8f89] transition hover:bg-white/6 hover:text-white"
                          aria-label="Edit card"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Description</span>
                    <p className={cn("min-w-0 flex-1", card.description ? "text-[#ecece8]" : "text-[#8f8f89]")}>
                      {card.description || "None"}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Due date</span>
                    <p className="min-w-0 flex-1 text-[#ecece8]">{formatDate(card.dueDate)}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Assignees</span>
                    {card.assignees.length > 0 ? (
                      <p className="min-w-0 flex-1 text-[#ecece8]">
                        {card.assignees.map((assignee) => assignee.user.name).join(", ")}
                      </p>
                    ) : (
                      <p className="min-w-0 flex-1 text-[#8f8f89]">None</p>
                    )}
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Created</span>
                    <p className="min-w-0 flex-1">
                      <span className="text-[#ecece8]">{card.creator.name}</span>{" "}
                      <span className="text-[#7f7f7a]">at</span>{" "}
                      <span className="text-[#ecece8]">{formatDateTime(card.createdAt)}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-[72px] shrink-0 text-[#7f7f7a]">Labels</span>
                    {card.labels.length > 0 ? (
                      <span className="inline-flex min-w-0 flex-1 flex-wrap gap-1.5 align-middle">
                        {card.labels.map(({ id, label }) => (
                          <span
                            key={id}
                            className="inline-flex rounded-full border px-1.75 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em]"
                            style={{
                              borderColor: `${label.color}55`,
                              backgroundColor: `${label.color}1a`,
                              color: label.color,
                            }}
                          >
                            {label.name}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <p className="min-w-0 flex-1 text-[#8f8f89]">None</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="ui-pressed-active flex min-h-0 flex-1 flex-col rounded-[12px] border px-2.5 py-2.5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#8f8f89]" />
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#7f7f7a]">
                Activity
              </p>
            </div>
            <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
              {activityItems.length > 0 ? (
                activityItems.map((item) => (
                  <div key={item.id} className="border-b border-white/6 pb-2 last:border-b-0 last:pb-0">
                    <p className="text-[12px] text-[#e1e1dc]">{item.label}</p>
                    <p className="mt-1 text-[11px] text-[#7f7f7a]">
                      {formatDateTime(item.timestamp)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8f8f89]">No card activity yet.</p>
              )}
            </div>
          </div>
          {actionError ? (
            <p className="px-0.5 text-xs text-[#f07f6a]">{actionError}</p>
          ) : null}
            </div>
          ) : (
            <div className="mt-2.5 flex h-[430px] flex-col gap-2">
          <div className="ui-pressed-active min-h-0 flex-1 rounded-[12px] border px-2.5 py-2.5">
            <div className="h-full space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
              {card.comments.length > 0 ? (
                card.comments.map((item) => (
                  <div key={item.id} className="border-b border-white/6 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-start gap-2">
                      <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#d66c12] text-[8px] font-semibold text-white">
                        {getAvatarFallback(item.user.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[11px] font-medium text-[#ecece8]">
                            {item.user.name}
                          </p>
                          <p className="text-[10px] text-[#7f7f7a]">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[11px] leading-[1.125rem] text-[#d2d2cd]">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#8f8f89]">No comments yet.</p>
              )}
            </div>
          </div>

          <div className="ui-pressed-active rounded-[12px] border px-2.5 py-2">
            <label className="block">
              <span className="sr-only">Comment</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={1}
                placeholder="Write a comment"
                className="min-h-[22px] w-full resize-none bg-transparent text-[12px] text-white outline-none placeholder:text-[#6f6f6a]"
              />
            </label>
            <div className="mt-2 flex items-center justify-between gap-3">
              {actionError ? (
                <p className="text-xs text-[#f07f6a]">{actionError}</p>
              ) : <span />}
              <button
                type="button"
                onClick={() => void handleSubmitComment()}
                disabled={!comment.trim() || isSubmittingComment}
                className="ui-pressed-button rounded-[10px] border px-3 py-1.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingComment ? "Posting..." : "Comment"}
              </button>
            </div>
          </div>
            </div>
          )}
        </div>

        {isConfirmingArchive ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="w-full max-w-[320px] rounded-[14px] border border-white/10 bg-[#111112] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <p className="text-sm font-medium text-white">Archive card?</p>
              <p className="mt-2 text-xs leading-5 text-[#a0a09a]">
                Are you sure you want to archive this card? It will be removed from the
                active list and kept in an archived state.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingArchive(false)}
                  className="rounded-[10px] border border-white/10 bg-transparent px-3 py-1.5 text-sm text-white transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleArchive()}
                  disabled={isArchiveSubmitting}
                  className="rounded-[10px] border border-[#8f2e2e] bg-[#b93838] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#c54545] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isArchiveSubmitting ? "Archiving..." : "Archive"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardModal>
  );
}
