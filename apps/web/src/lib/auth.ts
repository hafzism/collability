import axios, { AxiosError } from "axios";

export const AUTH_COOKIE_NAME = "collability_auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type ApiErrorResponse = {
  message?: string | string[];
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

function normalizeApiErrorMessage(message: ApiErrorResponse["message"]) {
  if (Array.isArray(message)) {
    return message[0] ?? "Something went wrong. Please try again.";
  }

  return message ?? "Something went wrong. Please try again.";
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

async function apiRequest<T>(
  path: string,
  init: {
    body?: unknown;
    method: "GET" | "POST";
  },
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: path,
      method: init.method,
      data: init.body,
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      normalizeApiErrorMessage(axiosError.response?.data?.message),
    );
  }
}

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
