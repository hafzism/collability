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
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignupStep = "email" | "otp" | "profile";
type BannerTone = "neutral" | "error" | "success";

function getBannerClassName(tone: BannerTone) {
  if (tone === "error") {
    return "text-red-300";
  }

  if (tone === "success") {
    return "text-emerald-300";
  }

  return "text-muted-foreground";
}

export function SignupFlow() {
  const [step, setStep] = useState<SignupStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<null | {
    tone: BannerTone;
    message: string;
  }>(null);

  const emailError =
    banner?.tone === "error" && step === "email" ? banner.message : undefined;
  const otpError =
    banner?.tone === "error" && step === "otp" ? banner.message : undefined;
  const profileError =
    banner?.tone === "error" && step === "profile" ? banner.message : undefined;

  async function handleContinueEmail() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setBanner({
        tone: "error",
        message: "Enter your work email to continue.",
      });
      return;
    }

    setIsSubmitting(true);
    setBanner({
      tone: "neutral",
      message: "Sending your verification code...",
    });

    await new Promise((resolve) => setTimeout(resolve, 700));

    if (!trimmedEmail.includes("@")) {
      setBanner({
        tone: "error",
        message: "Please enter a valid email address.",
      });
      setIsSubmitting(false);
      return;
    }

    setStep("otp");
    setBanner({
      tone: "success",
      message: "A verification code has been sent to your inbox.",
    });
    setIsSubmitting(false);
  }

  async function handleVerifyOtp() {
    setIsSubmitting(true);
    setBanner({
      tone: "neutral",
      message: "Verifying your code...",
    });

    await new Promise((resolve) => setTimeout(resolve, 650));

    if (otp.trim().length !== 6) {
      setBanner({
        tone: "error",
        message: "Enter the 6-digit code to continue.",
      });
      setIsSubmitting(false);
      return;
    }

    setStep("profile");
    setBanner({
      tone: "success",
      message: "Email verified. Finish your profile to create the workspace.",
    });
    setIsSubmitting(false);
  }

  async function handleCreateAccount() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setBanner({
        tone: "error",
        message: "Add your name so teammates know it’s you.",
      });
      return;
    }

    if (password.length < 6) {
      setBanner({
        tone: "error",
        message: "Choose a password with at least 6 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setBanner({
        tone: "error",
        message: "Passwords do not match.",
      });
      return;
    }

    setIsSubmitting(true);
    setBanner({
      tone: "neutral",
      message: "Creating your workspace...",
    });

    await new Promise((resolve) => setTimeout(resolve, 900));

    setBanner({
      tone: "success",
      message: `You're all set, ${trimmedName}. Your workspace is ready.`,
    });
    setIsSubmitting(false);
  }

  async function handleGoogleSignup() {
    setIsSubmitting(true);
    setBanner({
      tone: "neutral",
      message: "Connecting to Google...",
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    setStep("profile");
    if (!name) {
      setName("Alex Morgan");
    }
    if (!email) {
      setEmail("alex@collability.app");
    }
    setBanner({
      tone: "success",
      message:
        "Google account connected. Finish the last details to create your workspace.",
    });
    setIsSubmitting(false);
  }

  return (
    <AuthCard>
      <AuthCardHeader
        eyebrow={<AuthCardBrand />}
        title="Create account"
        description="Set up your workspace."
      />

      <AuthCardBody>
        {banner ? (
          <p
            role="status"
            aria-live="polite"
            className={cn(
              "flex min-h-5 items-center gap-2 text-sm leading-6",
              getBannerClassName(banner.tone),
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {banner.message}
          </p>
        ) : null}

        {step === "email" ? (
          <div className="space-y-5">
            <GoogleAuthButton
              label="Continue with Google"
              loadingLabel="Connecting..."
              isLoading={isSubmitting}
              onClick={handleGoogleSignup}
            />

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" />
              or use email
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <AuthInput
              id="signup-email"
              type="email"
              label="Work email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={emailError}
            />

            <Button
              size="lg"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleContinueEmail}
            >
              {isSubmitting ? "Sending code..." : "Continue"}
            </Button>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="space-y-5">
            <AuthInput
              id="signup-otp"
              inputMode="numeric"
              label="Verification code"
              placeholder="123456"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              error={otpError}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => {
                  setStep("email");
                  setBanner(null);
                }}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleVerifyOtp}
              >
                {isSubmitting ? "Verifying..." : "Verify code"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "profile" ? (
          <div className="space-y-5">
            <AuthInput
              id="signup-name"
              label="Full name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={profileError?.includes("name") ? profileError : undefined}
            />

            <AuthInput
              id="signup-password"
              type="password"
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={
                profileError?.includes("password") ? profileError : undefined
              }
            />

            <AuthInput
              id="signup-confirm-password"
              type="password"
              label="Confirm password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={profileError?.includes("match") ? profileError : undefined}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => {
                  setStep("otp");
                  setBanner(null);
                }}
              >
                Back
              </Button>
              <Button
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleCreateAccount}
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </div>
        ) : null}
      </AuthCardBody>

      <AuthCardFooter>
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-white transition-colors hover:text-muted-foreground"
        >
          Sign in
        </Link>
      </AuthCardFooter>
    </AuthCard>
  );
}
