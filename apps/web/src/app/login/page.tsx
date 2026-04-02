"use client";

import Link from "next/link";
import { useState } from "react";

import {
  AuthCardBrand,
  AuthCard,
  AuthCardBody,
  AuthCardFooter,
  AuthCardHeader,
} from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedbackTone = "neutral" | "error" | "success";

function getFeedbackClassName(tone: FeedbackTone) {
  if (tone === "error") {
    return "text-red-300";
  }

  if (tone === "success") {
    return "text-emerald-300";
  }

  return "text-muted-foreground";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<null | {
    tone: FeedbackTone;
    message: string;
  }>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setIsSubmitting(true);
    setFeedback({
      tone: "neutral",
      message: "Checking your credentials...",
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email.trim().includes("@")) {
      setFeedback({
        tone: "error",
        message: "Enter a valid email address to continue.",
      });
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setFeedback({
        tone: "error",
        message: "Your password must be at least 6 characters long.",
      });
      setIsSubmitting(false);
      return;
    }

    if (email.includes("error")) {
      setFeedback({
        tone: "error",
        message:
          "We couldn't sign you in with those details. Please try again.",
      });
      setIsSubmitting(false);
      return;
    }

    setFeedback({
      tone: "success",
      message: "Welcome back. Your workspace is ready.",
    });
    setIsSubmitting(false);
  }

  async function handleGoogleLogin() {
    setIsSubmitting(true);
    setFeedback({
      tone: "neutral",
      message: "Connecting to Google...",
    });

    await new Promise((resolve) => setTimeout(resolve, 700));

    setFeedback({
      tone: "success",
      message: "Google account connected successfully.",
    });
    setIsSubmitting(false);
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthCardHeader
          eyebrow={<AuthCardBrand />}
          title="Sign in"
          description="Continue to your workspace."
        />

        <AuthCardBody>
          {feedback ? (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "flex min-h-5 items-center gap-2 text-sm leading-6",
                getFeedbackClassName(feedback.tone),
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {feedback.message}
            </p>
          ) : null}

          <div className="space-y-5">
            <GoogleAuthButton
              label="Continue with Google"
              loadingLabel="Connecting..."
              isLoading={isSubmitting}
              onClick={handleGoogleLogin}
            />

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" />
              or use email
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <AuthInput
              id="login-email"
              type="email"
              label="Email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={
                feedback?.tone === "error" && feedback.message.includes("email")
                  ? feedback.message
                  : undefined
              }
            />

            <AuthInput
              id="login-password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={
                feedback?.tone === "error" &&
                feedback.message.includes("Password")
                  ? feedback.message
                  : feedback?.tone === "error" &&
                      feedback.message.includes("Passwords")
                    ? feedback.message
                    : undefined
              }
            />

            <Button
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleLogin}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </AuthCardBody>

        <AuthCardFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            New to Collability?{" "}
            <Link
              href="/signup"
              className="text-white transition-colors hover:text-muted-foreground"
            >
              Create an account
            </Link>
          </span>
          <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Secure
          </span>
        </AuthCardFooter>
      </AuthCard>
    </AuthShell>
  );
}
