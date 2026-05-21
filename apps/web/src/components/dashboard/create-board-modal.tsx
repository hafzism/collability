"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { DashboardModal } from "./dashboard-modal";
import type { BoardRole, BoardSummary, BoardVisibility } from "./board-types";
import type { WorkspaceMember } from "./workspace-types";
import { getAvatarFallback } from "./workspace-utils";

type CreateBoardModalProps = {
  currentUserId: string;
  onClose: () => void;
  onCreateBoard: (values: {
    title: string;
    description: string;
    visibility: BoardVisibility;
  }) => Promise<BoardSummary>;
  onSubmitMembers: (input: {
    boardId: string;
    members: Array<{
      userId: string;
      role: BoardRole;
    }>;
  }) => Promise<void>;
  workspaceMembers: WorkspaceMember[];
  workspaceName: string;
};

type SelectedBoardMember = {
  userId: string;
  role: BoardRole;
};

const BOARD_ROLE_OPTIONS: BoardRole[] = ["MANAGER", "CONTRIBUTOR", "VIEWER"];

function validateBoardTitle(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "Board title is required.";
  }

  return undefined;
}

function formatBoardRole(role: BoardRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function CreateBoardModal({
  currentUserId,
  onClose,
  onCreateBoard,
  onSubmitMembers,
  workspaceMembers,
  workspaceName,
}: CreateBoardModalProps) {
  const [step, setStep] = useState<"details" | "members">("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<BoardVisibility>("WORKSPACE");
  const [createdBoard, setCreatedBoard] = useState<BoardSummary | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<SelectedBoardMember[]>(
    [],
  );
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const [isSubmittingMembers, setIsSubmittingMembers] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const titleError = useMemo(() => validateBoardTitle(title), [title]);
  const normalizedTitle = useMemo(
    () => title.trim().replace(/\s+/g, " "),
    [title],
  );
  const normalizedDescription = useMemo(
    () => description.trim().replace(/\s+/g, " "),
    [description],
  );

  const selectedMemberIds = useMemo(
    () => new Set(selectedMembers.map((member) => member.userId)),
    [selectedMembers],
  );

  const availableMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    return workspaceMembers
      .filter((member) => member.userId !== currentUserId)
      .filter((member) => !selectedMemberIds.has(member.userId))
      .filter((member) => {
        if (!query) {
          return true;
        }

        return (
          member.user.name.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)
        );
      });
  }, [currentUserId, memberSearch, selectedMemberIds, workspaceMembers]);

  const selectedMemberDetails = useMemo(() => {
    const membersById = new Map(
      workspaceMembers.map((member) => [member.userId, member]),
    );

    return selectedMembers
      .map((member) => {
        const detail = membersById.get(member.userId);

        if (!detail) {
          return null;
        }

        return {
          ...member,
          detail,
        };
      })
      .filter((member) => member !== null);
  }, [selectedMembers, workspaceMembers]);

  async function handleCreateBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateBoardTitle(title);
    if (validationError) {
      return;
    }

    setIsSubmittingDetails(true);
    setSubmitError(null);

    try {
      const board = await onCreateBoard({
        title: normalizedTitle,
        description: normalizedDescription,
        visibility,
      });

      setCreatedBoard(board);
      setStep("members");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to create board right now.",
      );
    } finally {
      setIsSubmittingDetails(false);
    }
  }

  async function handleFinish() {
    if (!createdBoard) {
      return;
    }

    setIsSubmittingMembers(true);
    setSubmitError(null);

    try {
      await onSubmitMembers({
        boardId: createdBoard.id,
        members: selectedMembers,
      });
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save board members right now.",
      );
      setIsSubmittingMembers(false);
    }
  }

  function handleAddMember(userId: string) {
    setSelectedMembers((current) => [...current, { userId, role: "VIEWER" }]);
  }

  function handleRemoveSelectedMember(userId: string) {
    setSelectedMembers((current) =>
      current.filter((member) => member.userId !== userId),
    );
  }

  function handleRoleChange(userId: string, role: BoardRole) {
    setSelectedMembers((current) =>
      current.map((member) =>
        member.userId === userId ? { ...member, role } : member,
      ),
    );
  }

  return (
    <DashboardModal
      className="flex h-[min(760px,calc(100vh-48px))] max-w-3xl flex-col"
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 pb-5">
        <div>
          <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
            {step === "details" ? "Set up your board" : "Add board members"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-[#9a9a95]">
            {step === "details"
              ? `Create a board inside ${workspaceName}.`
              : visibility === "WORKSPACE"
                ? "Everyone in this workspace can already view this board. Add members here only to override their board role."
                : "Only added members can access this board, aside from workspace owners and admins who can still view it."}
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

      <div className="mb-5 flex shrink-0 gap-2">
        <div
          className={cn(
            "rounded-[12px] border px-4 py-2 text-sm",
            step === "details"
              ? "ui-pressed-active font-medium text-[#f0f0ec]"
              : "border-transparent text-[#8f8f89]",
          )}
        >
          1. Details
        </div>
        <div
          className={cn(
            "rounded-[12px] border px-4 py-2 text-sm",
            step === "members"
              ? "ui-pressed-active font-medium text-[#f0f0ec]"
              : "border-transparent text-[#8f8f89]",
          )}
        >
          2. Members
        </div>
      </div>

      {step === "details" ? (
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleCreateBoard}>
          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#ecece8]">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Product roadmap"
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
                placeholder="What this board is for, who uses it, and what belongs here."
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
                      aria-pressed={isSelected}
                      className={cn(
                        "rounded-[14px] border px-4 py-3 text-left transition",
                        isSelected
                          ? "ui-pressed-active text-[#f3f3f0]"
                          : "border-white/8 bg-[#111112] text-[#a0a09a] hover:border-white/12 hover:text-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {option === "WORKSPACE" ? "Workspace" : "Private"}
                          </p>
                        </div>

                        {isSelected ? (
                          <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#77d08a]" />
                        ) : null}
                      </div>

                      <p className="mt-3 text-xs leading-5 text-inherit/80">
                        {option === "WORKSPACE"
                          ? "All workspace members can see it in viewer mode unless you override them."
                          : "Only explicit board members can access it, plus workspace owners and admins as viewers."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {titleError ? (
              <p className="text-xs text-[#f07f6a]">{titleError}</p>
            ) : null}
            {submitError ? (
              <p className="text-xs text-[#f07f6a]">{submitError}</p>
            ) : null}
          </div>

          <div className="mt-auto flex items-center justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(titleError) || isSubmittingDetails}
              className="ui-pressed-primary rounded-[12px] border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingDetails ? "Creating..." : "Continue"}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[0.90fr_1.10fr]">
            <section className="ui-pressed-active flex min-h-0 flex-col overflow-hidden rounded-[14px] border">
              <div className="border-b border-white/8 p-4">
                <p className="text-sm font-medium text-[#f0f0ec]">
                  Workspace members
                </p>
                <div className="ui-pressed-active mt-4 flex items-center gap-2 rounded-[12px] border px-3">
                  <Search className="h-4 w-4 text-[#72726e]" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Search by name or email"
                    className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-[#676762]"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
                {availableMembers.length > 0 ? (
                  availableMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
                    >
                      {member.user.avatarUrl ? (
                        <div
                          aria-label={member.user.name}
                          className="h-9 w-9 rounded-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${member.user.avatarUrl})`,
                          }}
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d66c12] text-xs font-semibold text-white">
                          {getAvatarFallback(member.user.name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#f0f0ec]">
                          {member.user.name}
                        </p>
                        <p className="truncate text-xs text-[#8f8f89]">
                          {member.user.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddMember(member.userId)}
                        className="ui-pressed-button rounded-[10px] border px-3 py-1.5 text-xs font-medium transition"
                      >
                        Add
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-sm text-[#8f8f89]">
                    No workspace members match this search.
                  </div>
                )}
              </div>
            </section>

            <section className="ui-pressed-active flex min-h-0 flex-col overflow-hidden rounded-[14px] border">
              <div className="border-b border-white/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[#f0f0ec]">
                    Added members
                  </p>
                  <span className="ui-pressed-active rounded-[10px] border px-3 py-1 text-[11px] font-medium text-[#c9c9c4]">
                    {selectedMembers.length}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#8f8f89]">
                  The board creator stays a manager automatically.
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
                {selectedMemberDetails.length > 0 ? (
                  selectedMemberDetails.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center gap-3 border-b border-white/6 px-4 py-3 last:border-b-0"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d66c12] text-xs font-semibold text-white">
                        {getAvatarFallback(member.detail.user.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#f0f0ec]">
                          {member.detail.user.name}
                        </p>
                        <p className="truncate text-xs text-[#8f8f89]">
                          {member.detail.user.email}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="ui-pressed-open inline-flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#d6d6d1] outline-none transition"
                          >
                            <span>{formatBoardRole(member.role)}</span>
                            <ChevronDown className="h-3.5 w-3.5 transition group-data-[state=open]:rotate-180" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {BOARD_ROLE_OPTIONS.map((role) => {
                            const isSelected = member.role === role;

                            return (
                              <DropdownMenuItem
                                key={role}
                                onClick={() =>
                                  handleRoleChange(member.userId, role)
                                }
                                className={cn(
                                  isSelected
                                    ? "ui-pressed-active"
                                    : "text-[#c3c3be] hover:bg-white/6 hover:text-white",
                                )}
                              >
                                <span>{formatBoardRole(role)}</span>
                                {isSelected ? (
                                  <Check className="ml-auto h-3.5 w-3.5 text-[#d9d9d4]" />
                                ) : null}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button
                        type="button"
                        onClick={() => handleRemoveSelectedMember(member.userId)}
                        className="rounded-[10px] p-2 text-[#8f8f89] transition hover:bg-white/6 hover:text-white"
                        aria-label={`Remove ${member.detail.user.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-sm text-[#8f8f89]">
                    No one added yet. You can finish now and add members later.
                  </div>
                )}
              </div>
            </section>
          </div>

          {submitError ? (
            <p className="mt-4 text-xs text-[#f07f6a]">{submitError}</p>
          ) : null}

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep("details")}
              className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition"
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={isSubmittingMembers}
                className="ui-pressed-primary rounded-[12px] border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingMembers ? "Saving..." : "Finish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardModal>
  );
}
