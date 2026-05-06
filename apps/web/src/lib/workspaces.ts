import axios, { AxiosError } from "axios";
import type {
  WorkspaceDetail,
  WorkspaceInviteResponse,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
} from "@/components/dashboard/workspace-types";

type ApiErrorResponse = {
  message?: string | string[];
};

export type WorkspaceSummaryResponse = WorkspaceSummary;
export type WorkspaceDetailResponse = WorkspaceDetail;
export type WorkspaceMemberResponse = WorkspaceMember;
export type WorkspaceInviteResponseBody = WorkspaceInviteResponse;

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

export function getWorkspace(workspaceId: string) {
  return apiRequest<WorkspaceDetailResponse>(`/workspaces/${workspaceId}`, {
    method: "GET",
  });
}

export function updateWorkspace(workspaceId: string, input: { name: string }) {
  return apiRequest<WorkspaceSummaryResponse>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: input,
  });
}

export function inviteWorkspaceMember(input: {
  workspaceId: string;
  email: string;
}) {
  return apiRequest<WorkspaceInviteResponseBody>(
    `/workspaces/${input.workspaceId}/invitations`,
    {
      method: "POST",
      body: {
        email: input.email,
      },
    },
  );
}

export function joinWorkspace(input: { code: string }) {
  return apiRequest<WorkspaceSummaryResponse>("/workspaces/join", {
    method: "POST",
    body: input,
  });
}

export function updateWorkspaceMemberRole(input: {
  workspaceId: string;
  userId: string;
  role: Exclude<WorkspaceRole, "OWNER">;
}) {
  return apiRequest<WorkspaceMemberResponse>(
    `/workspaces/${input.workspaceId}/members/${input.userId}`,
    {
      method: "PATCH",
      body: {
        role: input.role,
      },
    },
  );
}

export function removeWorkspaceMember(input: {
  workspaceId: string;
  userId: string;
}) {
  return apiRequest<void>(
    `/workspaces/${input.workspaceId}/members/${input.userId}`,
    {
      method: "DELETE",
    },
  );
}

export function leaveWorkspace(workspaceId: string) {
  return apiRequest<void>(`/workspaces/${workspaceId}/members/me`, {
    method: "DELETE",
  });
}

export function deleteWorkspace(workspaceId: string) {
  return apiRequest<void>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
  });
}
