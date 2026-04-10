"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";

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
  const [isEditingName, setIsEditingName] = useState(false);
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
    setIsEditingName(false);
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4">
      <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#101010] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-4 pb-4">
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
              {workspace.name}
            </h2>
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
          <div className="mt-5 space-y-8">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="border-b border-white/8 pb-6">
                <div>
                  <h3 className="text-sm font-medium text-[#f1f1ef]">
                    Workspace info
                  </h3>
                </div>
                <div className="mt-5 space-y-5 text-sm text-[#d1d1cc]">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#72726d]">
                        Name
                      </p>
                      {isEditingName ? (
                        <div className="mt-2 max-w-md space-y-2">
                          <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full rounded-[14px] border border-white/10 bg-[#151515] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40"
                          />
                          {error ? (
                            <p className="text-xs text-[#f07f6a]">{error}</p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-base text-[#f3f3ef]">
                          {workspace.name}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditingName ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setName(workspace.name);
                              setIsEditingName(false);
                            }}
                            className="rounded-[12px] px-3 py-2 text-sm text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={Boolean(error) || !hasChanges}
                            className="rounded-[12px] bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e9e9e6] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="rounded-[12px] p-2 text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
                          aria-label="Edit workspace name"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#72726d]">
                      Slug
                    </p>
                    <p className="mt-2">{nextSlug}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#72726d]">
                      Created by
                    </p>
                    <p className="mt-2">{workspace.createdBy}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#72726d]">
                      Created at
                    </p>
                    <p className="mt-2">{formatWorkspaceDate(workspace.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#72726d]">
                      Viewer
                    </p>
                    <p className="mt-2">{currentUserName}</p>
                  </div>
                </div>
              </div>
            </form>

            <section className="border-b border-white/8 pb-6">
              <h3 className="text-sm font-medium text-[#f1f1ef]">Members</h3>
              <p className="mt-3 text-sm text-[#8a8a86]">-</p>
            </section>

            <section className="pb-2">
              <h3 className="text-sm font-medium text-[#f1f1ef]">Delete workspace</h3>
              <p className="mt-2 text-sm text-[#b99088]">
                Deleting this workspace is permanent. Type
                {" "}
                <span className="font-medium text-[#f2d5cf]">
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
                  className="flex-1 rounded-[14px] border border-white/10 bg-[#151515] px-4 py-3 text-sm text-white outline-none transition focus:border-white/40"
                />
                <button
                  type="button"
                  onClick={() => onDeleteWorkspace(workspace.id)}
                  disabled={!canDelete}
                  className="rounded-[14px] bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-[#e9e9e6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete workspace
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-5">
            <h3 className="text-sm font-medium text-[#f1f1ef]">Activity</h3>
            {activityItems.length === 0 ? (
              <p className="mt-3 text-sm text-[#8a8a86]">No activity yet.</p>
            ) : (
              <div className="mt-4 divide-y divide-white/8">
                {activityItems.map((item) => (
                  <div key={item.id} className="py-3">
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
