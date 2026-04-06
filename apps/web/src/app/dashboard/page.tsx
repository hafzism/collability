"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser, getErrorMessage, type AuthUser } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) {
          return;
        }

        setUser(currentUser);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          getErrorMessage(error, "Your session expired. Please sign in again."),
        );
        router.replace("/login");
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!user) {
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
            {errorMessage ?? "Checking your session."}
          </p>
        </div>
      </main>
    );
  }

  return <DashboardShell userName={user.name} />;
}
