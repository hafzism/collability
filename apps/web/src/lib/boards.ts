import { apiRequest } from "./api-client";

import type {
  BoardActivityItem,
  BoardDetail,
  BoardLabel,
  BoardMember,
  BoardRole,
  BoardSummary,
  BoardVisibility,
} from "@/components/dashboard/board-types";

export function listWorkspaceBoards(workspaceId: string) {
  return apiRequest<BoardSummary[]>(`/workspaces/${workspaceId}/boards`, {
    method: "GET",
  });
}

export function createBoard(input: {
  workspaceId: string;
  title: string;
  description: string;
  visibility: BoardVisibility;
}) {
  return apiRequest<BoardSummary>(`/workspaces/${input.workspaceId}/boards`, {
    method: "POST",
    body: {
      title: input.title,
      description: input.description || undefined,
      visibility: input.visibility,
    },
  });
}

export function addBoardMember(input: {
  boardId: string;
  userId: string;
  role: BoardRole;
}) {
  return apiRequest<BoardMember>(`/boards/${input.boardId}/members`, {
    method: "POST",
    body: {
      userId: input.userId,
      role: input.role,
    },
  });
}

export function getBoard(boardId: string) {
  return apiRequest<BoardDetail>(`/boards/${boardId}`, {
    method: "GET",
  });
}

export function getBoardActivity(boardId: string) {
  return apiRequest<BoardActivityItem[]>(`/boards/${boardId}/activity`, {
    method: "GET",
  });
}

export function updateBoard(input: {
  boardId: string;
  title?: string;
  description?: string;
  visibility?: BoardVisibility;
}) {
  return apiRequest<BoardSummary>(`/boards/${input.boardId}`, {
    method: "PATCH",
    body: {
      title: input.title,
      description: input.description,
      visibility: input.visibility,
    },
  });
}

export function deleteBoard(input: { boardId: string }) {
  return apiRequest<void>(`/boards/${input.boardId}`, {
    method: "DELETE",
  });
}

export function updateBoardMemberRole(input: {
  boardId: string;
  userId: string;
  role: BoardRole;
}) {
  return apiRequest<BoardMember>(
    `/boards/${input.boardId}/members/${input.userId}`,
    {
      method: "PATCH",
      body: {
        role: input.role,
      },
    },
  );
}

export function removeBoardMember(input: { boardId: string; userId: string }) {
  return apiRequest<void>(`/boards/${input.boardId}/members/${input.userId}`, {
    method: "DELETE",
  });
}

export function createBoardLabel(input: {
  boardId: string;
  name: string;
  color: string;
}) {
  return apiRequest<BoardLabel>(`/boards/${input.boardId}/labels`, {
    method: "POST",
    body: {
      name: input.name,
      color: input.color,
    },
  });
}
