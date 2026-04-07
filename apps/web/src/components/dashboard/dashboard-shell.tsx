"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { boardItems, workspaceItems } from "./dashboard-types";

export function DashboardShell({ userName }: { userName: string }) {
  const [activeBoardId, setActiveBoardId] = useState(boardItems[0]?.id ?? "");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    workspaceItems[0]?.id ?? "",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const activeBoard =
    boardItems.find((item) => item.id === activeBoardId) ?? boardItems[0];
  const activeWorkspace =
    workspaceItems.find((item) => item.id === activeWorkspaceId) ??
    workspaceItems[0] ?? {
      id: "workspace",
      name: userName,
    };
  const userInitials = userName.trim().slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        isWorkspaceMenuOpen &&
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(target)
      ) {
        setIsWorkspaceMenuOpen(false);
      }

      if (
        isAccountMenuOpen &&
        accountMenuRef.current &&
        !accountMenuRef.current.contains(target)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isAccountMenuOpen, isWorkspaceMenuOpen]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f3f1]">
      <div className="flex min-h-screen">
        <DashboardSidebar
          accountMenuRef={accountMenuRef}
          activeBoard={activeBoard}
          activeWorkspace={activeWorkspace}
          boardItems={boardItems}
          isAccountMenuOpen={isAccountMenuOpen}
          isSidebarOpen={isSidebarOpen}
          isWorkspaceMenuOpen={isWorkspaceMenuOpen}
          onAccountMenuToggle={() =>
            setIsAccountMenuOpen((currentState) => !currentState)
          }
          onBoardSelect={setActiveBoardId}
          onHideSidebar={() => setIsSidebarOpen(false)}
          onWorkspaceMenuToggle={() =>
            setIsWorkspaceMenuOpen((currentState) => !currentState)
          }
          onWorkspaceSelect={(workspaceId) => {
            setActiveWorkspaceId(workspaceId);
            setIsWorkspaceMenuOpen(false);
          }}
          userInitials={userInitials}
          userName={userName}
          workspaceItems={workspaceItems}
          workspaceMenuRef={workspaceMenuRef}
        />

        <section
          className={cn(
            "flex min-h-screen flex-1 bg-[#050505] transition-[padding] duration-200",
            isSidebarOpen ? "p-3" : "p-2",
          )}
        >
          <div className="flex min-h-full flex-1 flex-col overflow-hidden rounded-[18px] border border-white/6 bg-[#0f0f10] shadow-[0_0_0_1px_rgba(255,255,255,0.015)] transition-[border-radius,border-color] duration-200">
            <DashboardTopbar
              boardName={activeBoard.name}
              isSidebarOpen={isSidebarOpen}
              onShowSidebar={() => setIsSidebarOpen(true)}
            />

            <div className="flex-1" />
          </div>
        </section>
      </div>
    </div>
  );
}
