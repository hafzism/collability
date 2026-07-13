"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
import { getErrorMessage, login, startGoogleAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setEmailError(undefined);
    setPasswordError(undefined);

    if (!email.trim().includes("@")) {
      setEmailError("Enter a valid email address to continue.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Your password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace("/dashboard");
    } catch (error) {
      setPasswordError(
        getErrorMessage(
          error,
          "We couldn't sign you in with those details. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthCardHeader eyebrow={<AuthCardBrand />} title="Sign in to Collability" />

        <AuthCardBody>
          <div className="space-y-5">
            <GoogleAuthButton
              label="Continue with Google"
              onClick={startGoogleAuth}
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
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(undefined);
              }}
              error={emailError}
            />

            <AuthInput
              id="login-password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(undefined);
              }}
              error={passwordError}
            />

            <div className="-mt-3 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleLogin}
            >
              {isSubmitting ? "Continuing with email..." : "Continue with email"}
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
        </AuthCardFooter>
      </AuthCard>
    </AuthShell>
  );
}
