"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  normalizeWorkspaceName,
  slugifyWorkspaceName,
  validateWorkspaceName,
} from "./workspace-utils";

type CreateWorkspaceModalProps = {
  onClose: () => void;
  onSubmit: (values: { name: string }) => Promise<void>;
};

export function CreateWorkspaceModal({
  onClose,
  onSubmit,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const error = useMemo(() => validateWorkspaceName(name), [name]);
  const slugPreview = useMemo(() => slugifyWorkspaceName(name), [name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateWorkspaceName(name);
    if (validationError) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: normalizeWorkspaceName(name),
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to create workspace right now.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#111111] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
        <div className="space-y-5">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
              Create workspace
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#ecece8]">
                Workspace name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Product Ops"
                className="w-full rounded-[14px] border border-white/10 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d66c12]/70"
              />
            </label>

            {slugPreview ? (
              <p className="text-xs text-[#7f7f7a]">
                Backend URL slug preview:{" "}
                <span className="text-[#b8b8b3]">{slugPreview}</span>
              </p>
            ) : null}

            {error ? <p className="text-xs text-[#f07f6a]">{error}</p> : null}
            {submitError ? (
              <p className="text-xs text-[#f07f6a]">{submitError}</p>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[12px] px-4 py-2 text-sm text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(error) || isSubmitting}
                className="rounded-[12px] bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e9e9e6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
