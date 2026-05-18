import { apiRequest } from "./api-client";

export const AUTH_COOKIE_NAME = "collability_auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function requestOtp(email: string) {
  return apiRequest<{ message: string }>("/auth/request-otp", {
    method: "POST",
    body: { email },
  });
}

export function verifyOtp(email: string, code: string) {
  return apiRequest<{ verificationToken: string }>("/auth/verify-otp", {
    method: "POST",
    body: { email, code },
  });
}

export function register(input: {
  email: string;
  name: string;
  password: string;
  verificationToken: string;
}) {
  return apiRequest<{ user: AuthUser }>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export function getCurrentUser() {
  return apiRequest<AuthUser>("/auth/me", {
    method: "GET",
  });
}
