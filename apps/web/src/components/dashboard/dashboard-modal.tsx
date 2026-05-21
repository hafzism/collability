"use client";

import type { MouseEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardModalProps = {
  children: ReactNode;
  className?: string;
  onClose: () => void;
};

export function DashboardModal({
  children,
  className,
  onClose,
}: DashboardModalProps) {
  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/72 px-4"
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
    >
      <div
        className={cn(
          "ui-pressed-active w-full rounded-[14px] border p-6",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
