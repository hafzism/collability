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
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Button } from "@/components/ui/button";
import { register, requestOtp, startGoogleAuth, verifyOtp } from "@/lib/auth";

type SignupStep = "email" | "otp" | "profile";

export function SignupFlow() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | undefined>();
  const [nameError, setNameError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | undefined
  >();
  const [verificationToken, setVerificationToken] = useState("");

  async function handleSendOtp() {
    const trimmedEmail = email.trim().toLowerCase();

    setEmailError(undefined);

    if (!trimmedEmail) {
      setEmailError("Enter your work email to continue.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestOtp(trimmedEmail);
      setEmail(trimmedEmail);
      setStep("otp");
      setOtp("");
      setOtpError(undefined);
    } catch {
      setEmailError("We couldn't send an OTP right now. Please try again.");
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
      const result = await verifyOtp(email.trim().toLowerCase(), trimmedOtp);
      setVerificationToken(result.verificationToken);
      setStep("profile");
    } catch {
      setOtpError("We couldn't verify that OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp() {
    const trimmedName = name.trim();

    setNameError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);

    if (!trimmedName) {
      setNameError("Add your name so teammates know it's you.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Choose a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    if (!verificationToken) {
      setOtpError("Verify your OTP before signing up.");
      setStep("otp");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: email.trim().toLowerCase(),
        name: trimmedName,
        password,
        verificationToken,
      });
      router.replace("/dashboard");
    } catch {
      setPasswordError("We couldn't create your account right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBackToEmail() {
    setStep("email");
    setOtp("");
    setVerificationToken("");
    setOtpError(undefined);
  }

  return (
    <AuthCard>
      <AuthCardHeader
        eyebrow={<AuthCardBrand />}
        title="Create account"
      />

      <AuthCardBody>
        {step === "email" ? (
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
              id="signup-email"
              type="email"
              label="Work email"
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
              id="signup-otp"
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

        {step === "profile" ? (
          <div className="space-y-5">
            <AuthInput
              id="signup-name"
              label="Full name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(undefined);
              }}
              error={nameError}
            />

            <AuthInput
              id="signup-password"
              type="password"
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(undefined);
              }}
              error={passwordError}
            />

            <AuthInput
              id="signup-confirm-password"
              type="password"
              label="Confirm password"
              placeholder="Confirm your password"
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
                onClick={handleSignUp}
              >
                {isSubmitting ? "Signing up..." : "Sign up"}
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
