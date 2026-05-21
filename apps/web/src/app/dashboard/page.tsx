"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { dashboardQueryKeys } from "@/components/dashboard/dashboard-query-keys";
import {
  getCurrentUser,
  getErrorMessage,
  logout,
  type AuthUser,
} from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUserQuery = useQuery<AuthUser>({
    queryKey: dashboardQueryKeys.auth.currentUser,
    queryFn: getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (currentUserQuery.isError) {
      queryClient.clear();
      router.replace("/login");
    }
  }, [currentUserQuery.isError, queryClient, router]);

  async function handleLogout() {
    await logout();
    queryClient.clear();
    router.replace("/login");
  }

  if (!currentUserQuery.data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Loading your workspace...
          </h1>
          <p className="mt-3 text-muted-foreground">
            {currentUserQuery.isError
              ? getErrorMessage(
                  currentUserQuery.error,
                  "Your session expired. Please sign in again.",
                )
              : "Checking your session."}
          </p>
        </div>
      </main>
    );
  }

  return <DashboardShell user={currentUserQuery.data} onLogout={handleLogout} />;
}
