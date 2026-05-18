import axios, { AxiosError } from "axios";

import type { BoardList } from "@/components/dashboard/board-types";

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
