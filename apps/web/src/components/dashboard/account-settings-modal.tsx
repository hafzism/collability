"use client";

import { useMemo, useState } from "react";
import { LaptopMinimal, Smartphone, X } from "lucide-react";

import { getErrorMessage, type AuthSession } from "@/lib/auth";
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

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;

  if (!Number.isFinite(timestamp) || diffMs < 0) {
    return "Active just now";
  }

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "Active just now";
  }

  if (minutes < 60) {
    return `Active ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Active ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `Active ${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Active ${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(months / 12);
  return `Active ${years} ${years === 1 ? "year" : "years"} ago`;
}

function getBrowserLabel(userAgent: string | null) {
  if (!userAgent) {
    return "Browser";
  }

  const normalized = userAgent.toLowerCase();

  if (normalized.includes("edg/")) {
    return "Edge";
  }

  if (normalized.includes("chrome/") && !normalized.includes("edg/")) {
    return "Chrome";
  }

  if (normalized.includes("firefox/")) {
    return "Firefox";
  }

  if (normalized.includes("safari/") && !normalized.includes("chrome/")) {
    return "Safari";
  }

  return "Browser";
}

function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return "Unknown device";
  }

  const normalized = userAgent.toLowerCase();

  if (normalized.includes("ipad")) {
    return "iPad";
  }

  if (normalized.includes("iphone")) {
    return "iPhone";
  }

  if (normalized.includes("android")) {
    return normalized.includes("mobile") ? "Android phone" : "Android tablet";
  }

  if (normalized.includes("windows")) {
    return "Windows";
  }

  if (normalized.includes("mac")) {
    return "Mac";
  }

  if (normalized.includes("linux")) {
    return "Linux";
  }

  return "Desktop";
}

function getDeviceTitle(userAgent: string | null) {
  return `${getBrowserLabel(userAgent)} on ${getDeviceLabel(userAgent)}`;
}

function isMobileDevice(userAgent: string | null) {
  return /iphone|android|mobile|ipad/i.test(userAgent ?? "");
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
    if (otherSessionsCount === 0) {
      return;
    }

    setIsLoggingOutOthers(true);
    setActionError(null);

    try {
      await onLogoutOtherDevices();
    } catch (error) {
      setActionError(
        getErrorMessage(error, "Unable to log out other devices right now."),
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
        getErrorMessage(error, "Unable to log out this device right now."),
      );
    } finally {
      setPendingSessionId(null);
    }
  }

  return (
    <DashboardModal
      className="flex h-[min(720px,calc(100vh-48px))] max-w-3xl flex-col"
      onClose={onClose}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 pb-4">
        <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[#f5f5f3]">
          Settings
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="rounded-[12px] p-2 text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex shrink-0 gap-2">
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
        <div className="flex h-full min-h-0 flex-col gap-4">
          <section className="shrink-0">
            <div className="ui-pressed-active rounded-[14px] border p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#f0f0ec]">
                    Where you are logged in
                  </p>
                  <p className="mt-1 text-xs text-[#8f8f89]">
                    Review all active devices that have access to your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogoutOthers()}
                  disabled={otherSessionsCount === 0 || isLoggingOutOthers}
                  className={cn(
                    "rounded-[12px] border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-45",
                    otherSessionsCount > 0
                      ? "ui-pressed-danger"
                      : "ui-pressed-button text-[#8f8f89]",
                  )}
                >
                  {isLoggingOutOthers ? "Logging out..." : "Log out other devices"}
                </button>
              </div>
            </div>
          </section>

          <section className="min-h-0 flex-1">
            {isLoading ? (
              <div className="ui-pressed-active flex min-h-[360px] items-center justify-center rounded-[14px] border border-dashed px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-[#d9d9d4]">
                    Loading devices
                  </p>
                  <p className="mt-2 text-sm text-[#8f8f89]">
                    Checking where your account is signed in.
                  </p>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="ui-pressed-active flex min-h-[360px] items-center justify-center rounded-[14px] border border-dashed px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-[#d9d9d4]">
                    No active devices found
                  </p>
                  <p className="mt-2 text-sm text-[#8f8f89]">
                    Devices will appear here after you sign in.
                  </p>
                </div>
              </div>
            ) : (
              <div className="ui-pressed-active flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border">
                <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(255,255,255,0.28)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
                  {sessions.map((session) => {
                    const deviceTitle = getDeviceTitle(session.userAgent);
                    const Icon = isMobileDevice(session.userAgent)
                      ? Smartphone
                      : LaptopMinimal;

                    return (
                      <div
                        key={session.id}
                        className="flex flex-col gap-4 border-b border-white/6 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-white/8 bg-[#111111] text-[#e7e7e2]">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-[#f0f0ec]">
                                {deviceTitle}
                              </p>
                              {session.isCurrent ? (
                                <span className="ui-pressed-active rounded-[10px] border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#d4d4cf]">
                                  This device
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-[#8f8f89]">
                              {formatRelativeTime(session.lastSeenAt)}
                            </p>
                          </div>
                        </div>

                        <div className="sm:ml-auto">
                          {session.isCurrent ? (
                            <span className="inline-flex rounded-[12px] border border-white/10 px-3.5 py-2 text-xs text-[#8f8f89]">
                              Current device
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
