import { apiRequest } from "./api-client";
import { REFRESH_TOKEN_COOKIE_NAME } from "./auth-constants";
import { clearAccessToken, setAccessToken } from "./auth-session";

export { REFRESH_TOKEN_COOKIE_NAME };

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthSession = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  expiresAt: string;
  createdAt: string;
  isCurrent: boolean;
};

type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error instanceof Error && error.message) {
    return getUserSafeErrorMessage(error.message, fallback);
  }

  return fallback;
}

function getUserSafeErrorMessage(message: string, fallback: string) {
  const normalizedMessage = message.toLowerCase();
  const isTechnicalAuthMessage =
    normalizedMessage.includes("refresh token") ||
    normalizedMessage.includes("jwt") ||
    normalizedMessage === "unauthorized";

  if (isTechnicalAuthMessage) {
    return "Your session expired. Please sign in again.";
  }

  return message || fallback;
}

export function requestOtp(email: string) {
  return apiRequest<{ message: string }>("/auth/request-otp", {
    method: "POST",
    body: { email },
    skipAuthRetry: true,
  });
}

export function verifyOtp(email: string, code: string) {
  return apiRequest<{ verificationToken: string }>("/auth/verify-otp", {
    method: "POST",
    body: { email, code },
    skipAuthRetry: true,
  });
}

export function startGoogleAuth() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  window.location.href = `${apiBaseUrl}/auth/google`;
}

export function completeOAuthLogin(accessToken: string) {
  setAccessToken(accessToken);
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>("/auth/request-password-reset", {
    method: "POST",
    body: { email },
    skipAuthRetry: true,
  });
}

export function verifyPasswordReset(email: string, code: string) {
  return apiRequest<{ resetToken: string }>("/auth/verify-password-reset", {
    method: "POST",
    body: { email, code },
    skipAuthRetry: true,
  });
}

export function resetPassword(input: {
  email: string;
  password: string;
  resetToken: string;
}) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: input,
    skipAuthRetry: true,
  });
}

export function register(input: {
  email: string;
  name: string;
  password: string;
  verificationToken: string;
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
    skipAuthRetry: true,
  }).then((result) => {
    setAccessToken(result.accessToken);
    return result;
  });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
    skipAuthRetry: true,
  }).then((result) => {
    setAccessToken(result.accessToken);
    return result;
  });
}

export function getCurrentUser() {
  return apiRequest<AuthUser>("/auth/me", {
    method: "GET",
  });
}

export async function logout() {
  try {
    return await apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
      skipAuthRetry: true,
    });
  } finally {
    clearAccessToken();
  }
}

export function listSessions() {
  return apiRequest<AuthSession[]>("/auth/sessions", {
    method: "GET",
  });
}

export function logoutOtherDevices() {
  return apiRequest<{ message: string }>("/auth/logout-others", {
    method: "POST",
  });
}

export function logoutDeviceSession(sessionId: string) {
  return apiRequest<{ message: string }>(`/auth/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
