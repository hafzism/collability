"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import {
  AuthCard,
  AuthCardBody,
  AuthCardBrand,
  AuthCardFooter,
  AuthCardHeader,
} from "@/components/auth/auth-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { completeOAuthLogin } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [{ accessToken, error, isLoaded }, setCallbackState] = useState<{
    accessToken: string | null;
    error: string | null;
    isLoaded: boolean;
  }>({
    accessToken: null,
    error: null,
    isLoaded: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", "/auth/callback");

    queueMicrotask(() => {
      setCallbackState({
        accessToken: params.get("access_token"),
        error: params.get("error"),
        isLoaded: true,
      });
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (error || !accessToken) {
      return;
    }

    completeOAuthLogin(accessToken);
    router.replace("/dashboard");
  }, [accessToken, error, isLoaded, router]);

  const displayError =
    error ??
    (isLoaded && !accessToken
      ? "Google sign-in did not return a valid session."
      : null);

  return (
    <AuthShell>
      <AuthCard>
        <AuthCardHeader
          eyebrow={<AuthCardBrand />}
          title={displayError ? "Sign-in failed" : "Finishing sign-in"}
        />
        <AuthCardBody>
          {displayError ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">
                {displayError}
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Securing your session...
            </div>
          )}
        </AuthCardBody>
        {displayError ? (
          <AuthCardFooter>
            New to Collability?{" "}
            <Link
              href="/signup"
              className="text-white transition-colors hover:text-muted-foreground"
            >
              Create an account
            </Link>
          </AuthCardFooter>
        ) : null}
      </AuthCard>
    </AuthShell>
  );
}
