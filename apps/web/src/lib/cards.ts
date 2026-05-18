import { apiRequest } from "./api-client";

import type {
  BoardCard,
  BoardCardActivityItem,
  BoardCardComment,
  BoardCardDetail,
} from "@/components/dashboard/board-types";

export function listCards(boardId: string, listId: string) {
  return apiRequest<BoardCard[]>(`/boards/${boardId}/lists/${listId}/cards`, {
    method: "GET",
  });
}

export function createCard(input: {
  boardId: string;
  listId: string;
  title: string;
  description?: string;
  dueDate?: string;
  labelIds?: string[];
  assigneeIds?: string[];
}) {
  return apiRequest<BoardCard>(`/boards/${input.boardId}/lists/${input.listId}/cards`, {
    method: "POST",
    body: {
      title: input.title,
      description: input.description || undefined,
      dueDate: input.dueDate || undefined,
      labelIds: input.labelIds,
      assigneeIds: input.assigneeIds,
    },
  });
}

export function updateCard(input: {
  boardId: string;
  listId: string;
  cardId: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
  labelIds?: string[];
  assigneeIds?: string[];
}) {
  return apiRequest<BoardCard>(
    `/boards/${input.boardId}/lists/${input.listId}/cards/${input.cardId}`,
    {
      method: "PATCH",
      body: {
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        labelIds: input.labelIds,
        assigneeIds: input.assigneeIds,
      },
    },
  );
}

export function reorderCard(input: {
  boardId: string;
  listId: string;
  cardId: string;
  beforeId?: string;
  afterId?: string;
}) {
  return apiRequest<BoardCard>(
    `/boards/${input.boardId}/lists/${input.listId}/cards/${input.cardId}/reorder`,
    {
      method: "PATCH",
      body: {
        beforeId: input.beforeId,
        afterId: input.afterId,
      },
    },
  );
}

export function moveCard(input: {
  boardId: string;
  listId: string;
  cardId: string;
  targetListId: string;
  beforeId?: string;
  afterId?: string;
}) {
  return apiRequest<BoardCard>(
    `/boards/${input.boardId}/lists/${input.listId}/cards/${input.cardId}/move`,
    {
      method: "PATCH",
      body: {
        targetListId: input.targetListId,
        beforeId: input.beforeId,
        afterId: input.afterId,
      },
    },
  );
}

export function getCardDetail(input: {
  boardId: string;
  listId: string;
  cardId: string;
}) {
  return apiRequest<BoardCardDetail>(
    `/boards/${input.boardId}/lists/${input.listId}/cards/${input.cardId}`,
    {
      method: "GET",
    },
  );
}

export function getCardActivity(input: {
  boardId: string;
  listId: string;
  cardId: string;
}) {
  return apiRequest<BoardCardActivityItem[]>(
    `/boards/${input.boardId}/lists/${input.listId}/cards/${input.cardId}/activity`,
    {
      method: "GET",
    },
  );
}

export function createCardComment(input: {
  boardId: string;
  listId: string;
  cardId: string;
  content: string;
}) {
  return apiRequest<BoardCardComment>(
    `/boards/${input.boardId}/lists/${input.listId}/cards/${input.cardId}/comments`,
    {
      method: "POST",
      body: {
        content: input.content,
      },
      },
    );
}

export function deleteCard(input: {
  boardId: string;
  listId: string;
  cardId: string;
}) {
  return apiRequest<void>(
    `/boards/${input.boardId}/lists/${input.listId}/cards/${input.cardId}`,
    {
      method: "DELETE",
    },
  );
}
