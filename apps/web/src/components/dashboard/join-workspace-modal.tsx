"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  formatWorkspaceJoinCodeInput,
  normalizeWorkspaceJoinCode,
} from "./workspace-utils";

type JoinWorkspaceModalProps = {
  onClose: () => void;
  onSubmit: (values: { code: string }) => Promise<void>;
};

export function JoinWorkspaceModal({
  onClose,
  onSubmit,
}: JoinWorkspaceModalProps) {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedCode = useMemo(() => normalizeWorkspaceJoinCode(code), [code]);
  const isCodeComplete = normalizedCode.length === 11;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isCodeComplete) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        code: normalizedCode,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to join workspace right now.",
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
              Join workspace
            </h2>
            <p className="mt-2 text-sm text-[#9f9f99]">
              Enter the invite code you received by email. You&apos;ll join as a
              guest first.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#ecece8]">
                Invite code
              </span>
              <input
                value={code}
                onChange={(event) =>
                  setCode(formatWorkspaceJoinCodeInput(event.target.value))
                }
                placeholder="abc-def-ghi"
                className="w-full rounded-[14px] border border-white/10 bg-[#171717] px-4 py-3 text-center font-mono text-lg lowercase tracking-[0.24em] text-white outline-none transition focus:border-[#d66c12]/70"
              />
            </label>

            {!isCodeComplete && normalizedCode.length > 0 ? (
              <p className="text-xs text-[#8f8f89]">
                Invite codes use the format `abc-def-ghi`.
              </p>
            ) : null}
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
                disabled={!isCodeComplete || isSubmitting}
                className="rounded-[12px] bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e9e9e6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Joining..." : "Join workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
