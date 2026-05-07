"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, ChevronDown, Pencil, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DashboardModal } from "./dashboard-modal";
import type {
  WorkspaceDetail,
  WorkspaceActivityItem,
  WorkspaceInviteResponse,
} from "./workspace-types";
import {
  canDeleteWorkspace,
  formatWorkspaceDate,
  formatWorkspaceRole,
  getAvatarFallback,
  normalizeWorkspaceName,
  validateWorkspaceName,
} from "./workspace-utils";

import { cn } from "@/lib/utils";

type WorkspaceDetailsModalProps = {
  activityItems: WorkspaceActivityItem[];
  currentUserId: string;
  onClose: () => void;
  onDeleteWorkspace: (workspaceId: string) => Promise<void>;
  onInviteMember: (input: {
    workspaceId: string;
    email: string;
  }) => Promise<WorkspaceInviteResponse>;
  onLeaveWorkspace: (workspaceId: string) => Promise<void>;
  onRemoveMember: (input: {
    workspaceId: string;
    userId: string;
  }) => Promise<void>;
  onUpdateMemberRole: (input: {
    workspaceId: string;
    userId: string;
    role: "ADMIN" | "MEMBER" | "GUEST";
  }) => Promise<void>;
  onUpdateWorkspace: (
    workspaceId: string,
    updates: { name: string },
  ) => Promise<void>;
  workspace: WorkspaceDetail | null;
};

const MANAGEABLE_ROLES: Array<"ADMIN" | "MEMBER" | "GUEST"> = [
  "ADMIN",
  "MEMBER",
  "GUEST",
];

function roleBadgeClasses() {
  return "border-white/10 bg-white/[0.03] text-[#d6d6d1]";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function WorkspaceDetailsModal({
  activityItems,
  currentUserId,
  onClose,
  onDeleteWorkspace,
  onInviteMember,
  onLeaveWorkspace,
  onRemoveMember,
  onUpdateMemberRole,
  onUpdateWorkspace,
  workspace,
}: WorkspaceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"manage" | "activity">("manage");
  const [name, setName] = useState(workspace?.name ?? "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);

  const error = useMemo(() => validateWorkspaceName(name), [name]);
  const normalizedName = useMemo(() => normalizeWorkspaceName(name), [name]);
  const hasChanges = workspace !== null && normalizedName !== workspace.name;
  const canDelete = canDeleteWorkspace(deleteConfirmation);
  const currentUserRole = workspace?.currentUserRole ?? "GUEST";
  const canManageMembers =
    currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canEditWorkspace = canManageMembers;
  const canDeleteWorkspaceRecord = currentUserRole === "OWNER";
  const canLeaveWorkspace = currentUserRole !== "OWNER";
  const ownerMember =
    workspace?.members.find((member) => member.role === "OWNER") ?? null;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace || error || !hasChanges) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      await onUpdateWorkspace(workspace.id, {
        name: normalizedName,
      });
      setIsEditingName(false);
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update workspace right now.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!workspace || !canDelete || !canDeleteWorkspaceRecord) {
      return;
    }

    setIsDeleting(true);
    setActionError(null);

    try {
      await onDeleteWorkspace(workspace.id);
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete workspace right now.",
      );
      setIsDeleting(false);
    }
  }

  async function handleInviteMember() {
    if (!workspace || !isValidEmail(inviteEmail)) {
      return;
    }

    setIsInviting(true);
    setActionError(null);
    setInviteNotice(null);

    try {
      const response = await onInviteMember({
        workspaceId: workspace.id,
        email: inviteEmail.trim().toLowerCase(),
      });
      setInviteEmail("");
      setInviteNotice(
        `Invite sent to ${response.email}. Workspace code: ${response.joinCode}`,
      );
    } catch (inviteError) {
      setActionError(
        inviteError instanceof Error
          ? inviteError.message
          : "Unable to send invite right now.",
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(
    userId: string,
    role: "ADMIN" | "MEMBER" | "GUEST",
  ) {
    if (!workspace) {
      return;
    }

    setUpdatingMemberId(userId);
    setActionError(null);

    try {
      await onUpdateMemberRole({
        workspaceId: workspace.id,
        userId,
        role,
      });
    } catch (roleError) {
      setActionError(
        roleError instanceof Error
          ? roleError.message
          : "Unable to update member role right now.",
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!workspace) {
      return;
    }

    setRemovingMemberId(userId);
    setActionError(null);

    try {
      await onRemoveMember({
        workspaceId: workspace.id,
        userId,
      });
    } catch (removeError) {
      setActionError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove member right now.",
      );
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleLeaveWorkspace() {
    if (!workspace || !canLeaveWorkspace) {
      return;
    }

    setIsLeaving(true);
    setActionError(null);

    try {
      await onLeaveWorkspace(workspace.id);
    } catch (leaveError) {
      setActionError(
        leaveError instanceof Error
          ? leaveError.message
          : "Unable to leave workspace right now.",
      );
      setIsLeaving(false);
    }
  }

  if (!workspace) {
    return null;
  }

  return (
    <DashboardModal
      className="flex h-[min(760px,calc(100vh-48px))] max-w-3xl flex-col bg-[#101010] shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
      onClose={onClose}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 pb-4">
        <form onSubmit={handleSave} className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            {canEditWorkspace ? (
              isEditingName ? (
                <div className="mt-0.5 flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setName(workspace.name);
                      setIsEditingName(false);
                    }}
                    className="rounded-[10px] p-2 text-[#9a9a95] transition hover:bg-white/6 hover:text-white"
                    aria-label="Cancel workspace name edit"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(error) || !hasChanges || isSaving}
                    className="rounded-[10px] p-2 text-[#9a9a95] transition hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Save workspace name"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="mt-0.5 rounded-[10px] p-2 text-[#9a9a95] transition hover:bg-white/6 hover:text-white"
                  aria-label="Edit workspace name"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-3">
                {isEditingName ? (
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-0.5 text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3] outline-none placeholder:text-[#666660]"
                  />
                ) : (
                  <h2 className="truncate text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
                    {workspace.name}
                  </h2>
                )}
                {!isEditingName ? (
                  <span
                    className={`shrink-0 rounded-[10px] border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${roleBadgeClasses()}`}
                  >
                    {formatWorkspaceRole(currentUserRole)}
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-xs text-[#9a9a95]">
                Created by {ownerMember?.user.name ?? workspace.createdBy} at{" "}
                {formatWorkspaceDate(workspace.createdAt)}
              </p>

              {isEditingName && error ? (
                <p className="mt-2 text-xs text-[#f07f6a]">{error}</p>
              ) : null}
            </div>
          </div>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="rounded-[12px] p-2 text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("manage")}
          className={`rounded-[12px] px-4 py-2 text-sm transition ${
            activeTab === "manage"
              ? "bg-white/10 text-white"
              : "text-[#9a9a95] hover:bg-white/6 hover:text-white"
          }`}
        >
          Manage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`rounded-[12px] px-4 py-2 text-sm transition ${
            activeTab === "activity"
              ? "bg-white/10 text-white"
              : "text-[#9a9a95] hover:bg-white/6 hover:text-white"
          }`}
        >
          Activity
        </button>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-hidden">
        {activeTab === "manage" ? (
          <div className="flex h-full min-h-0 flex-col gap-5">
            <section className="min-h-0 flex-1 border-b border-white/8 pb-5">
              <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-white/8 bg-[#121212]">
                <div className="border-b border-white/8 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#f0f0ec]">
                        Members
                      </p>
                    </div>
                    <span className="rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-[#c9c9c4]">
                      {workspace.members.length}
                    </span>
                  </div>

                  {canManageMembers ? (
                    <div className="mt-4 flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(event) => {
                          setInviteEmail(event.target.value);
                          setActionError(null);
                          setInviteNotice(null);
                        }}
                        placeholder="teammate@company.com"
                        className="min-w-0 flex-1 rounded-[10px] border border-white/10 bg-[#171717] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-[#676762] focus:border-white/40"
                      />
                      <button
                        type="button"
                        onClick={handleInviteMember}
                        disabled={!isValidEmail(inviteEmail) || isInviting}
                        className="min-w-[96px] rounded-[10px] bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#e9e9e6] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isInviting ? "Sending" : "Invite"}
                      </button>
                    </div>
                  ) : null}

                  {inviteNotice ? (
                    <p className="mt-3 text-xs text-[#84d3a3]">
                      {inviteNotice}
                    </p>
                  ) : null}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
                  {workspace.members.map((member) => {
                    const isCurrentUser = member.userId === currentUserId;
                    const canEditRole =
                      canManageMembers &&
                      member.role !== "OWNER" &&
                      !isCurrentUser;
                    const canKickMember =
                      canManageMembers &&
                      member.role !== "OWNER" &&
                      !isCurrentUser;

                    return (
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
                            {isCurrentUser ? " (You)" : ""}
                          </p>
                          <p className="truncate text-xs text-[#8f8f89]">
                            {member.user.email}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative">
                            {canEditRole ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    disabled={
                                      updatingMemberId === member.userId
                                    }
                                    className={cn(
                                      "inline-flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] outline-none transition group",
                                      roleBadgeClasses(),
                                      "disabled:cursor-not-allowed disabled:opacity-60",
                                    )}
                                  >
                                    <span>
                                      {formatWorkspaceRole(member.role)}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 transition group-data-[state=open]:rotate-180" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {MANAGEABLE_ROLES.map((role) => {
                                    const isSelected = member.role === role;

                                    return (
                                      <DropdownMenuItem
                                        key={role}
                                        onClick={() =>
                                          void handleRoleChange(
                                            member.userId,
                                            role,
                                          )
                                        }
                                        className={cn(
                                          isSelected
                                            ? "bg-white/8 text-white"
                                            : "text-[#c3c3be] hover:bg-white/6 hover:text-white",
                                        )}
                                      >
                                        <span>{formatWorkspaceRole(role)}</span>
                                        {isSelected ? (
                                          <Check className="ml-auto h-3.5 w-3.5 text-[#d9d9d4]" />
                                        ) : null}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span
                                className={`inline-flex rounded-[10px] border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${roleBadgeClasses()}`}
                              >
                                {formatWorkspaceRole(member.role)}
                              </span>
                            )}
                          </div>

                          {canKickMember ? (
                            <button
                              type="button"
                              onClick={() =>
                                void handleRemoveMember(member.userId)
                              }
                              disabled={removingMemberId === member.userId}
                              className="rounded-[10px] border border-[#4a2723] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#d28f87] transition hover:border-[#6a3630] hover:text-[#f0b1a9] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {removingMemberId === member.userId
                                ? "Removing"
                                : "Kick"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="shrink-0 space-y-3">
              {canLeaveWorkspace ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#e8e8e4]">
                      Leave workspace
                    </p>
                    <p className="mt-1 text-xs text-[#8f8f89]">
                      You&apos;ll lose access until someone invites you again.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLeaveWorkspace}
                    disabled={isLeaving}
                    className="rounded-[12px] border border-white/10 px-4 py-2 text-sm text-[#d4d4cf] transition hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLeaving ? "Leaving..." : "Leave"}
                  </button>
                </div>
              ) : null}

              {canDeleteWorkspaceRecord ? (
                <div className="space-y-2 pt-2">
                  <p className="text-sm font-medium text-[#f5d4cf]">
                    Delete workspace
                  </p>
                  <p className="text-xs text-[#b98b84]">
                    Deleting will remove boards, lists, cards, members, and
                    activity. This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <input
                      value={deleteConfirmation}
                      onChange={(event) =>
                        setDeleteConfirmation(event.target.value)
                      }
                      placeholder='Type "delete permanently"'
                      className="min-w-0 flex-1 rounded-[12px] border border-[#6c322a] bg-[#180e0d] px-4 py-3 text-sm text-white outline-none transition focus:border-[#ca6d5f]"
                    />
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={!canDelete || isDeleting}
                      className="min-w-[104px] rounded-[12px] bg-[#ca4c37] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#dc5d48] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>

            {actionError ? (
              <p className="text-sm text-[#f07f6a]">{actionError}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-y-auto [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
            {activityItems.length === 0 ? (
              <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-[14px] border border-dashed border-white/10 bg-[#121212] px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-[#d9d9d4]">
                    No workspace activity yet
                  </p>
                  <p className="mt-2 max-w-sm text-sm text-[#8f8f89]">
                    Changes to members, roles, invitations, and workspace
                    settings will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activityItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[16px] border border-white/8 bg-[#141414] px-4 py-3"
                  >
                    <p className="text-sm text-[#f0f0ec]">{item.label}</p>
                    <p className="mt-1 text-xs text-[#8f8f89]">
                      {formatWorkspaceDate(item.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardModal>
  );
}
