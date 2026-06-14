"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DashboardPopoverPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute right-0 top-[calc(100%+10px)] z-30 flex h-[min(390px,calc(100vh-86px))] w-[340px] flex-col overflow-hidden rounded-[12px] border border-white/10 bg-[#141415] shadow-[0_24px_70px_rgba(0,0,0,0.48)] ring-1 ring-black/40",
        className,
      )}
    >
      {children}
    </div>
  );
}
