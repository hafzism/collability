import axios, { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string | string[];
};

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

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

export async function apiRequest<T>(
  path: string,
  init: {
    body?: unknown;
    method: ApiMethod;
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
