import { apiRequest } from "./api-client";

import type { BoardList } from "@/components/dashboard/board-types";

export function listBoardLists(boardId: string) {
  return apiRequest<BoardList[]>(`/boards/${boardId}/lists`, {
    method: "GET",
  });
}

export function createList(input: { boardId: string; title: string }) {
  return apiRequest<BoardList>(`/boards/${input.boardId}/lists`, {
    method: "POST",
    body: {
      title: input.title,
    },
  });
}

export function updateList(input: {
  boardId: string;
  listId: string;
  title?: string;
}) {
  return apiRequest<BoardList>(`/boards/${input.boardId}/lists/${input.listId}`, {
    method: "PATCH",
    body: {
      title: input.title,
    },
  });
}

export function reorderList(input: {
  boardId: string;
  listId: string;
  beforeId?: string;
  afterId?: string;
}) {
  return apiRequest<BoardList>(
    `/boards/${input.boardId}/lists/${input.listId}/reorder`,
    {
      method: "PATCH",
      body: {
        beforeId: input.beforeId,
        afterId: input.afterId,
      },
    },
  );
}

export function deleteList(input: { boardId: string; listId: string }) {
  return apiRequest<void>(`/boards/${input.boardId}/lists/${input.listId}`, {
    method: "DELETE",
  });
}
