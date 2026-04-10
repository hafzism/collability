"use client";

import { useMemo, useState, type FormEvent } from "react";

import type {
  WorkspaceActivityItem,
  WorkspaceSummary,
} from "./workspace-types";
import {
  canDeleteWorkspace,
  formatWorkspaceDate,
  normalizeWorkspaceName,
  slugifyWorkspaceName,
  validateWorkspaceName,
} from "./workspace-utils";

type WorkspaceDetailsModalProps = {
  activityItems: WorkspaceActivityItem[];
  currentUserName: string;
  onClose: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onUpdateWorkspace: (
    workspaceId: string,
    updates: Pick<WorkspaceSummary, "name" | "slug" | "updatedAt">,
  ) => void;
  workspace: WorkspaceSummary | null;
};

export function WorkspaceDetailsModal({
  activityItems,
  currentUserName,
  onClose,
  onDeleteWorkspace,
  onUpdateWorkspace,
  workspace,
}: WorkspaceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");
  const [name, setName] = useState(workspace?.name ?? "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const error = useMemo(() => validateWorkspaceName(name), [name]);
  const normalizedName = useMemo(() => normalizeWorkspaceName(name), [name]);
  const nextSlug = useMemo(() => slugifyWorkspaceName(name), [name]);
  const hasChanges =
    workspace !== null &&
    (normalizedName !== workspace.name || nextSlug !== workspace.slug);
  const canDelete = canDeleteWorkspace(deleteConfirmation);

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace || error || !hasChanges) {
      return;
    }

    onUpdateWorkspace(workspace.id, {
      name: normalizedName,
      slug: slugifyWorkspaceName(normalizedName),
      updatedAt: new Date().toISOString(),
    });
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#101010] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6f6f6a]">
              Workspace details
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
              {workspace.name}
            </h2>
            <p className="mt-1 text-sm text-[#8b8b87]">
              Review workspace metadata, upcoming member management, and recent
              activity.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] px-3 py-2 text-sm text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-[12px] px-4 py-2 text-sm transition ${
              activeTab === "overview"
                ? "bg-white/10 text-white"
                : "text-[#9a9a95] hover:bg-white/6 hover:text-white"
            }`}
          >
            Overview
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

        {activeTab === "overview" ? (
          <div className="mt-5 space-y-5">
            <form
              onSubmit={handleSave}
              className="rounded-[20px] border border-white/8 bg-[#151515] p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-[#f1f1ef]">
                    Workspace info
                  </h3>
                  <p className="mt-1 text-xs text-[#82827d]">
                    Update the name now. Slug remains derived from the current
                    name.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={Boolean(error) || !hasChanges}
                  className="rounded-[12px] bg-[#d66c12] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07a1f] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save changes
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#72726d]">
                    Name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-[14px] border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d66c12]/70"
                  />
                  {error ? (
                    <p className="text-xs text-[#f07f6a]">{error}</p>
                  ) : null}
                </label>

                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#72726d]">
                    Slug
                  </span>
                  <div className="rounded-[14px] border border-white/8 bg-[#101010] px-4 py-3 text-sm text-[#c4c4be]">
                    {nextSlug}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#72726d]">
                    Created by
                  </span>
                  <div className="rounded-[14px] border border-white/8 bg-[#101010] px-4 py-3 text-sm text-[#c4c4be]">
                    {workspace.createdBy}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#72726d]">
                    Created at
                  </span>
                  <div className="rounded-[14px] border border-white/8 bg-[#101010] px-4 py-3 text-sm text-[#c4c4be]">
                    {formatWorkspaceDate(workspace.createdAt)}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#72726d]">
                    Viewer context
                  </span>
                  <div className="rounded-[14px] border border-white/8 bg-[#101010] px-4 py-3 text-sm text-[#c4c4be]">
                    {currentUserName}
                  </div>
                </div>
              </div>
            </form>

            <section className="rounded-[20px] border border-white/8 bg-[#151515] p-5">
              <h3 className="text-sm font-medium text-[#f1f1ef]">Members</h3>
              <p className="mt-2 text-sm text-[#8a8a86]">
                Member invites and role management are coming in the next step.
                This modal already reserves the space so the backend-connected
                flow can slot in cleanly.
              </p>
            </section>

            <section className="rounded-[20px] border border-[#5e2018] bg-[#1a0f0d] p-5">
              <h3 className="text-sm font-medium text-[#f8d3cd]">Danger zone</h3>
              <p className="mt-2 text-sm text-[#d69f96]">
                Deleting this workspace is permanent. Type
                {" "}
                <span className="font-medium text-[#f5d5cf]">
                  delete permanently
                </span>
                {" "}
                to confirm.
              </p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder="delete permanently"
                  className="flex-1 rounded-[14px] border border-[#5e2018] bg-[#120b0a] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d66c12]/70"
                />
                <button
                  type="button"
                  onClick={() => onDeleteWorkspace(workspace.id)}
                  disabled={!canDelete}
                  className="rounded-[14px] bg-[#a13b28] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#b74833] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete workspace
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-5 rounded-[20px] border border-white/8 bg-[#151515] p-5">
            <h3 className="text-sm font-medium text-[#f1f1ef]">Activity</h3>
            {activityItems.length === 0 ? (
              <p className="mt-3 text-sm text-[#8a8a86]">No activity yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {activityItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[14px] border border-white/8 bg-[#101010] px-4 py-3"
                  >
                    <p className="text-sm text-[#e5e5e1]">{item.label}</p>
                    <p className="mt-1 text-xs text-[#7d7d78]">
                      {formatWorkspaceDate(item.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
