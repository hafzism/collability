"use client";

import { useMemo, useState } from "react";
import { LaptopMinimal, Shield, Smartphone, X } from "lucide-react";

import type { AuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { DashboardModal } from "./dashboard-modal";

type AccountSettingsModalProps = {
  errorMessage: string | null;
  isLoading: boolean;
  onClose: () => void;
  onLogoutDevice: (sessionId: string) => Promise<void>;
  onLogoutOtherDevices: () => Promise<void>;
  sessions: AuthSession[];
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return "Unknown device";
  }

  const normalized = userAgent.toLowerCase();
  const isMobile =
    normalized.includes("iphone") ||
    normalized.includes("android") ||
    normalized.includes("mobile") ||
    normalized.includes("ipad");

  if (normalized.includes("mac")) {
    return isMobile ? "Apple mobile device" : "Mac device";
  }

  if (normalized.includes("windows")) {
    return "Windows device";
  }

  if (normalized.includes("linux")) {
    return "Linux device";
  }

  return isMobile ? "Mobile device" : "Desktop device";
}

function getBrowserLabel(userAgent: string | null) {
  if (!userAgent) {
    return "Unknown browser";
  }

  const normalized = userAgent.toLowerCase();

  if (normalized.includes("edg/")) {
    return "Microsoft Edge";
  }

  if (normalized.includes("chrome/") && !normalized.includes("edg/")) {
    return "Google Chrome";
  }

  if (normalized.includes("firefox/")) {
    return "Mozilla Firefox";
  }

  if (normalized.includes("safari/") && !normalized.includes("chrome/")) {
    return "Safari";
  }

  return "Browser";
}

export function AccountSettingsModal({
  errorMessage,
  isLoading,
  onClose,
  onLogoutDevice,
  onLogoutOtherDevices,
  sessions,
}: AccountSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"devices">("devices");
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const otherSessionsCount = useMemo(
    () => sessions.filter((session) => !session.isCurrent).length,
    [sessions],
  );

  async function handleLogoutOthers() {
    setIsLoggingOutOthers(true);
    setActionError(null);

    try {
      await onLogoutOtherDevices();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to log out other devices right now.",
      );
    } finally {
      setIsLoggingOutOthers(false);
    }
  }

  async function handleLogoutDevice(sessionId: string) {
    setPendingSessionId(sessionId);
    setActionError(null);

    try {
      await onLogoutDevice(sessionId);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to log out this device right now.",
      );
    } finally {
      setPendingSessionId(null);
    }
  }

  return (
    <DashboardModal
      className="flex h-[min(760px,calc(100vh-48px))] max-w-3xl flex-col"
      onClose={onClose}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-[#151515] text-[#f0f0ec]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
                Account settings
              </h2>
              <p className="mt-1 text-xs text-[#9a9a95]">
                Review active devices and end sessions you no longer trust.
              </p>
            </div>
          </div>
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

      <div className="mt-4 flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("devices")}
          className={cn(
            "rounded-[12px] border border-transparent px-4 py-2 text-sm transition",
            activeTab === "devices"
              ? "ui-pressed-active font-medium"
              : "text-[#9a9a95] hover:bg-white/6 hover:text-white",
          )}
        >
          Devices
        </button>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col gap-5">
          <section className="shrink-0">
            <div className="ui-pressed-active rounded-[14px] border p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#f0f0ec]">
                    Active sessions
                  </p>
                  <p className="mt-1 text-xs text-[#8f8f89]">
                    These are the devices that still hold a valid refresh session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogoutOthers()}
                  disabled={otherSessionsCount === 0 || isLoggingOutOthers}
                  className="ui-pressed-button rounded-[12px] border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoggingOutOthers ? "Logging out..." : "Log out other devices"}
                </button>
              </div>
            </div>
          </section>

          <section className="min-h-0 flex-1">
            {isLoading ? (
              <div className="ui-pressed-active flex min-h-[420px] items-center justify-center rounded-[14px] border border-dashed px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-[#d9d9d4]">
                    Loading devices
                  </p>
                  <p className="mt-2 text-sm text-[#8f8f89]">
                    Pulling your active session list now.
                  </p>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="ui-pressed-active flex min-h-[420px] items-center justify-center rounded-[14px] border border-dashed px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-[#d9d9d4]">
                    No active devices found
                  </p>
                  <p className="mt-2 text-sm text-[#8f8f89]">
                    Once you sign in, device sessions will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="ui-pressed-active flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border">
                <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
                  {sessions.map((session) => {
                    const deviceLabel = getDeviceLabel(session.userAgent);
                    const browserLabel = getBrowserLabel(session.userAgent);
                    const isMobile = /iphone|android|mobile|ipad/i.test(
                      session.userAgent ?? "",
                    );

                    return (
                      <div
                        key={session.id}
                        className="flex flex-col gap-4 border-b border-white/6 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/8 bg-[#111111] text-[#e7e7e2]">
                            {isMobile ? (
                              <Smartphone className="h-4 w-4" />
                            ) : (
                              <LaptopMinimal className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-[#f0f0ec]">
                                {deviceLabel}
                              </p>
                              {session.isCurrent ? (
                                <span className="ui-pressed-active rounded-[10px] border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#d4d4cf]">
                                  This device
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-[#8f8f89]">
                              {browserLabel}
                              {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                            </p>
                            <p className="mt-2 text-xs text-[#666660]">
                              Last active {formatTimestamp(session.lastSeenAt)} ·
                              Added {formatTimestamp(session.createdAt)}
                            </p>
                            {session.userAgent ? (
                              <p className="mt-2 truncate text-[11px] text-[#5d5d58]">
                                {session.userAgent}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="sm:ml-auto">
                          {session.isCurrent ? (
                            <span className="inline-flex rounded-[12px] border border-white/10 px-3.5 py-2 text-xs text-[#8f8f89]">
                              Current session
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleLogoutDevice(session.id)}
                              disabled={pendingSessionId === session.id}
                              className="ui-pressed-danger rounded-[12px] border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {pendingSessionId === session.id
                                ? "Logging out..."
                                : "Log out"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {errorMessage || actionError ? (
            <p className="shrink-0 text-sm text-[#f07f6a]">
              {actionError ?? errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </DashboardModal>
  );
}
