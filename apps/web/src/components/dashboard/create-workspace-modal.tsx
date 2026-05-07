"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  normalizeWorkspaceName,
  validateWorkspaceName,
} from "./workspace-utils";
import { DashboardModal } from "./dashboard-modal";

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
    <DashboardModal className="max-w-md" onClose={onClose}>
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
              className="ui-pressed-active w-full rounded-[14px] border px-4 py-3 text-sm text-white outline-none transition"
            />
          </label>

          {error ? <p className="text-xs text-[#f07f6a]">{error}</p> : null}
          {submitError ? (
            <p className="text-xs text-[#f07f6a]">{submitError}</p>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(error) || isSubmitting}
              className="ui-pressed-primary rounded-[12px] border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create workspace"}
            </button>
          </div>
        </form>
      </div>
    </DashboardModal>
  );
}
