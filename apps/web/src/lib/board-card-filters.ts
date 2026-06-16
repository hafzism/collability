"use client";

export type BoardCardDueState = "overdue" | "today" | "this_week";

export type BoardCardFilters = {
  assigneeIds: string[];
  labelIds: string[];
  creatorIds: string[];
  listIds: string[];
  dueFrom: string;
  dueTo: string;
  dueState: BoardCardDueState | null;
  unassigned: boolean;
  withoutDueDate: boolean;
};

export const EMPTY_BOARD_CARD_FILTERS: BoardCardFilters = {
  assigneeIds: [],
  labelIds: [],
  creatorIds: [],
  listIds: [],
  dueFrom: "",
  dueTo: "",
  dueState: null,
  unassigned: false,
  withoutDueDate: false,
};

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function normalizeBoardCardFilters(
  filters: Partial<BoardCardFilters> | BoardCardFilters,
): BoardCardFilters {
  return {
    assigneeIds: uniqueSorted(filters.assigneeIds ?? []),
    labelIds: uniqueSorted(filters.labelIds ?? []),
    creatorIds: uniqueSorted(filters.creatorIds ?? []),
    listIds: uniqueSorted(filters.listIds ?? []),
    dueFrom: filters.dueFrom ?? "",
    dueTo: filters.dueTo ?? "",
    dueState: filters.dueState ?? null,
    unassigned: Boolean(filters.unassigned),
    withoutDueDate: Boolean(filters.withoutDueDate),
  };
}

export function hasAppliedBoardCardFilters(filters: BoardCardFilters) {
  return Boolean(
    filters.assigneeIds.length ||
      filters.labelIds.length ||
      filters.creatorIds.length ||
      filters.listIds.length ||
      filters.dueFrom ||
      filters.dueTo ||
      filters.dueState ||
      filters.unassigned ||
      filters.withoutDueDate,
  );
}

export function serializeBoardCardFilters(filters: BoardCardFilters) {
  return JSON.stringify(normalizeBoardCardFilters(filters));
}
