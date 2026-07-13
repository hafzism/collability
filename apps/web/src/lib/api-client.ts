import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from "axios";

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./auth-session";

type ApiErrorResponse = {
  message?: string | string[];
};

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";
type RefreshResponse = {
  accessToken: string;
};

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRetry?: boolean;
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

const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshRequestPromise: Promise<string> | null = null;
let clearSessionCookiePromise: Promise<void> | null = null;

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;
    const statusCode = error.response?.status;
    const shouldRetry =
      statusCode === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRetry &&
      !String(originalRequest.url ?? "").endsWith("/auth/refresh");

    if (!shouldRetry) {
      if (statusCode === 401) {
        clearAccessToken();
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshAccessToken();
      return apiClient.request(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      return Promise.reject(refreshError);
    }
  },
);

async function refreshAccessToken() {
  if (!refreshRequestPromise) {
    refreshRequestPromise = refreshClient
      .post<RefreshResponse>("/auth/refresh")
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .catch(() => {
        clearAccessToken();
        return clearServerSessionCookie().then(() => {
          throw new Error("Your session expired. Please sign in again.");
        });
      })
      .finally(() => {
        refreshRequestPromise = null;
      });
  }

  return refreshRequestPromise;
}

async function clearServerSessionCookie() {
  if (!clearSessionCookiePromise) {
    clearSessionCookiePromise = refreshClient
      .post("/auth/logout")
      .catch(() => undefined)
      .then(() => undefined)
      .finally(() => {
        clearSessionCookiePromise = null;
      });
  }

  return clearSessionCookiePromise;
}

export async function apiRequest<T>(
  path: string,
  init: {
    body?: unknown;
    method: ApiMethod;
    skipAuthRetry?: boolean;
  },
): Promise<T> {
  try {
    const requestConfig: RetryableAxiosRequestConfig = {
      url: path,
      method: init.method,
      data: init.body,
      skipAuthRetry: init.skipAuthRetry,
    };
    const response = await apiClient.request<T>(requestConfig);

    return response.data;
  } catch (error) {
    if (error instanceof Error && !(error as AxiosError).isAxiosError) {
      throw error;
    }

    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      normalizeApiErrorMessage(axiosError.response?.data?.message),
    );
  }
}
