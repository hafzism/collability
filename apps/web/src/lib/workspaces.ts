import type {
  WorkspaceActivityItem,
  WorkspaceDetail,
  WorkspaceInviteResponse,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
} from "@/components/dashboard/workspace-types";
import { apiRequest } from "./api-client";

export type WorkspaceSummaryResponse = WorkspaceSummary;
export type WorkspaceDetailResponse = WorkspaceDetail;
export type WorkspaceMemberResponse = WorkspaceMember;
export type WorkspaceInviteResponseBody = WorkspaceInviteResponse;

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

export function getWorkspaceActivity(workspaceId: string) {
  return apiRequest<WorkspaceActivityItem[]>(`/workspaces/${workspaceId}/activity`, {
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
