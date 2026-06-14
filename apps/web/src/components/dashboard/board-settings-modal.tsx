"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Bell, SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { DashboardModal } from "./dashboard-modal";
import type {
  BoardDetail,
  BoardNotificationSetting,
  BoardVisibility,
} from "./board-types";

type BoardSettingsModalProps = {
  board: BoardDetail;
  canManageBoard: boolean;
  notificationSetting: BoardNotificationSetting | null;
  onClose: () => void;
  onDeleteBoard: (input: { boardId: string }) => Promise<void>;
  onUpdateNotificationSetting: (
    boardId: string,
    input: {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      muted?: boolean;
      dueReminderMinutes?: number[];
    },
  ) => Promise<BoardNotificationSetting>;
  onUpdateBoard: (input: {
    boardId: string;
    title?: string;
    description?: string;
    visibility?: BoardVisibility;
  }) => Promise<void>;
};

type SettingsTab = "general" | "notifications";

const reminderOptions = [
  { label: "1 hour", value: 60 },
  { label: "1 day", value: 1440 },
  { label: "3 days", value: 4320 },
];

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
  notificationSetting,
  onClose,
  onDeleteBoard,
  onUpdateNotificationSetting,
  onUpdateBoard,
}: BoardSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description ?? "");
  const [visibility, setVisibility] = useState<BoardVisibility>(board.visibility);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [inAppEnabled, setInAppEnabled] = useState(
    notificationSetting?.inAppEnabled ?? true,
  );
  const [emailEnabled, setEmailEnabled] = useState(
    notificationSetting?.emailEnabled ?? false,
  );
  const [isMuted, setIsMuted] = useState(Boolean(notificationSetting?.mutedAt));
  const [dueReminderMinutes, setDueReminderMinutes] = useState<number[]>(
    notificationSetting?.dueReminderMinutes?.length
      ? notificationSetting.dueReminderMinutes
      : [1440],
  );

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
  const hasNotificationChanges =
    inAppEnabled !== (notificationSetting?.inAppEnabled ?? true) ||
    emailEnabled !== (notificationSetting?.emailEnabled ?? false) ||
    isMuted !== Boolean(notificationSetting?.mutedAt) ||
    dueReminderMinutes.join(",") !==
      (notificationSetting?.dueReminderMinutes?.length
        ? notificationSetting.dueReminderMinutes
        : [1440]
      ).join(",");
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

  async function handleSaveNotifications() {
    setIsSavingNotifications(true);
    setNotificationError(null);

    try {
      await onUpdateNotificationSetting(board.id, {
        inAppEnabled,
        emailEnabled,
        muted: isMuted,
        dueReminderMinutes,
      });
      setIsSavingNotifications(false);
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to update notification settings right now.",
      );
      setIsSavingNotifications(false);
    }
  }

  function toggleReminder(value: number) {
    setDueReminderMinutes((current) => {
      if (current.includes(value)) {
        const next = current.filter((item) => item !== value);
        return next.length > 0 ? next : current;
      }

      return [...current, value].sort((left, right) => left - right);
    });
  }

  return (
    <DashboardModal className="max-w-2xl" onClose={onClose}>
      <div className="relative">
        <div className={cn(isConfirmingDelete ? "pointer-events-none opacity-30 blur-[1px]" : "")}>
          <div className="flex items-start justify-between gap-4 pb-5">
            <div>
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
                {canManageBoard ? "Board settings" : "Board details"}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-[#9a9a95]">
                {canManageBoard
                  ? "Update the board title, description, and visibility, or delete it permanently."
                  : "View the current board title, description, and visibility."}
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

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-[12px] border border-white/8 bg-white/[0.025] p-1">
            {([
              ["general", SlidersHorizontal, "General"],
              ["notifications", Bell, "Notifications"],
            ] as const).map(([tab, Icon, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-[9px] px-3 py-2 text-sm transition",
                  activeTab === tab
                    ? "bg-white text-[#111112]"
                    : "text-[#a8a8a2] hover:bg-white/6 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {activeTab === "general" ? (
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

            <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-5">
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
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3">
                <label className="flex items-center justify-between gap-4 rounded-[12px] border border-white/8 bg-[#111112] px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-[#f2f2ef]">
                      In-app notifications
                    </span>
                    <span className="mt-1 block text-xs text-[#8f8f89]">
                      Store board notifications and show them in the bell menu.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={inAppEnabled}
                    onChange={(event) => setInAppEnabled(event.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-[12px] border border-white/8 bg-[#111112] px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-[#f2f2ef]">
                      Email notifications
                    </span>
                    <span className="mt-1 block text-xs text-[#8f8f89]">
                      Keep preference ready for production email delivery.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(event) => setEmailEnabled(event.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                </label>

                <label className="flex items-center justify-between gap-4 rounded-[12px] border border-white/8 bg-[#111112] px-4 py-3">
                  <span>
                    <span className="block text-sm font-medium text-[#f2f2ef]">
                      Mute this board
                    </span>
                    <span className="mt-1 block text-xs text-[#8f8f89]">
                      Stop creating new in-app reminders for this board.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isMuted}
                    onChange={(event) => setIsMuted(event.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[#ecece8]">
                  Due-date reminders
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {reminderOptions.map((option) => {
                    const isSelected = dueReminderMinutes.includes(option.value);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleReminder(option.value)}
                        className={cn(
                          "rounded-[12px] border px-3 py-2 text-sm transition",
                          isSelected
                            ? "border-white/25 bg-white text-[#111112]"
                            : "border-white/8 bg-[#111112] text-[#a8a8a2] hover:border-white/14 hover:text-white",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {notificationError ? (
                <p className="text-xs text-[#f07f6a]">{notificationError}</p>
              ) : null}

              <div className="flex items-center justify-end gap-3 border-t border-white/8 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasNotificationChanges || isSavingNotifications}
                  onClick={() => void handleSaveNotifications()}
                  className="ui-pressed-primary rounded-[12px] border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingNotifications ? "Saving..." : "Save settings"}
                </button>
              </div>
            </div>
          )}
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
