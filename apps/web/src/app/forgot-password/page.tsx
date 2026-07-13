"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AuthCard,
  AuthCardBody,
  AuthCardBrand,
  AuthCardFooter,
  AuthCardHeader,
} from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  getErrorMessage,
  requestPasswordReset,
  resetPassword,
  verifyPasswordReset,
} from "@/lib/auth";

type ResetStep = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >();

  async function handleSendOtp() {
    const trimmedEmail = email.trim().toLowerCase();
    setEmailError(undefined);

    if (!trimmedEmail.includes("@")) {
      setEmailError("Enter a valid email address to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setEmail(trimmedEmail);
      setOtp("");
      setStep("otp");
    } catch (error) {
      setEmailError(
        getErrorMessage(error, "We couldn't send a reset code right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    const trimmedOtp = otp.trim();
    setOtpError(undefined);

    if (trimmedOtp.length !== 6) {
      setOtpError("Enter the 6-digit OTP to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyPasswordReset(email.trim().toLowerCase(), trimmedOtp);
      setResetToken(result.resetToken);
      setStep("password");
    } catch (error) {
      setOtpError(getErrorMessage(error, "We couldn't verify that OTP."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);

    if (password.length < 6) {
      setPasswordError("Choose a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setOtpError("Verify your OTP before setting a new password.");
      setStep("otp");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        password,
        resetToken,
      });
      setStep("done");
    } catch (error) {
      setPasswordError(getErrorMessage(error, "We couldn't reset your password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackToEmail() {
    setStep("email");
    setOtp("");
    setResetToken("");
    setOtpError(undefined);
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthCardHeader eyebrow={<AuthCardBrand />} title="Reset password" />

        <AuthCardBody>
          {step === "email" ? (
            <div className="space-y-5">
              <AuthInput
                id="reset-email"
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

              <Button
                size="lg"
                className="w-full"
                disabled={isSubmitting}
                onClick={handleSendOtp}
              >
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </Button>
            </div>
          ) : null}

          {step === "otp" ? (
            <div className="space-y-5">
              <AuthInput
                id="reset-otp"
                inputMode="numeric"
                label={`Enter OTP sent to your email ${email}.`}
                placeholder="123456"
                wrapperClassName="space-y-4"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setOtpError(undefined);
                }}
                error={otpError}
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={handleBackToEmail}
                >
                  Use another email
                </Button>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={handleVerifyOtp}
                >
                  {isSubmitting ? "Verifying OTP..." : "Verify OTP"}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "password" ? (
            <div className="space-y-5">
              <AuthInput
                id="reset-password"
                type="password"
                label="New password"
                placeholder="Create a new password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError(undefined);
                }}
                error={passwordError}
              />

              <AuthInput
                id="reset-confirm-password"
                type="password"
                label="Confirm password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setConfirmPasswordError(undefined);
                }}
                error={confirmPasswordError}
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={handleBackToEmail}
                >
                  Use another email
                </Button>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={handleResetPassword}
                >
                  {isSubmitting ? "Resetting password..." : "Reset password"}
                </Button>
              </div>
            </div>
          ) : null}

          {step === "done" ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">
                Your password has been updated. Sign in again with your new password.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.replace("/login")}
              >
                Back to sign in
              </Button>
            </div>
          ) : null}
        </AuthCardBody>

        <AuthCardFooter>
          Remembered it?{" "}
          <Link
            href="/login"
            className="text-white transition-colors hover:text-muted-foreground"
          >
            Sign in
          </Link>
        </AuthCardFooter>
      </AuthCard>
    </AuthShell>
  );
}
