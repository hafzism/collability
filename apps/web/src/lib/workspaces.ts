import axios, { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string | string[];
};

export type WorkspaceSummaryResponse = {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER" | "GUEST";
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
    method: "GET" | "POST" | "PATCH" | "DELETE";
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

export function createWorkspace(input: { name: string }) {
  return apiRequest<WorkspaceSummaryResponse>("/workspaces", {
    method: "POST",
    body: input,
  });
}

export function listWorkspaces() {
  return apiRequest<WorkspaceSummaryResponse[]>("/workspaces", {
    method: "GET",
  });
}

export function updateWorkspace(workspaceId: string, input: { name: string }) {
  return apiRequest<WorkspaceSummaryResponse>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteWorkspace(workspaceId: string) {
  return apiRequest<void>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}
