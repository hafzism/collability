"use client";

import { create } from "zustand";

export type CardDetailModalState = {
  boardId: string;
  listId: string;
  cardId: string;
  initialTab: "details" | "comments";
};

type DashboardUiState = {
  activeBoardId: string;
  activeWorkspaceId: string;
  cardDetailModalState: CardDetailModalState | null;
  createListRequestId: number;
  isAccountMenuOpen: boolean;
  isAccountSettingsModalOpen: boolean;
  isBoardActivityModalOpen: boolean;
  isBoardMembersModalOpen: boolean;
  isBoardSettingsModalOpen: boolean;
  isCreateBoardModalOpen: boolean;
  isCreateWorkspaceModalOpen: boolean;
  isJoinWorkspaceModalOpen: boolean;
  isSidebarOpen: boolean;
  isWorkspaceMenuOpen: boolean;
  workspaceDetailsWorkspaceId: string | null;
  setActiveBoardId: (
    value: string | ((currentValue: string) => string),
  ) => void;
  setActiveWorkspaceId: (
    value: string | ((currentValue: string) => string),
  ) => void;
  setCardDetailModalState: (
    value:
      | CardDetailModalState
      | null
      | ((currentValue: CardDetailModalState | null) => CardDetailModalState | null),
  ) => void;
  setCreateListRequestId: (
    value: number | ((currentValue: number) => number),
  ) => void;
  setIsAccountMenuOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsAccountSettingsModalOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsBoardActivityModalOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsBoardMembersModalOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsBoardSettingsModalOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsCreateBoardModalOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsCreateWorkspaceModalOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsJoinWorkspaceModalOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsSidebarOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setIsWorkspaceMenuOpen: (
    value: boolean | ((currentValue: boolean) => boolean),
  ) => void;
  setWorkspaceDetailsWorkspaceId: (
    value: string | null | ((currentValue: string | null) => string | null),
  ) => void;
};

function resolveValue<T>(
  value: T | ((currentValue: T) => T),
  currentValue: T,
) {
  return typeof value === "function"
    ? (value as (currentValue: T) => T)(currentValue)
    : value;
}

export const useDashboardUiStore = create<DashboardUiState>((set) => ({
  activeBoardId: "",
  activeWorkspaceId: "",
  cardDetailModalState: null,
  createListRequestId: 0,
  isAccountMenuOpen: false,
  isAccountSettingsModalOpen: false,
  isBoardActivityModalOpen: false,
  isBoardMembersModalOpen: false,
  isBoardSettingsModalOpen: false,
  isCreateBoardModalOpen: false,
  isCreateWorkspaceModalOpen: false,
  isJoinWorkspaceModalOpen: false,
  isSidebarOpen: true,
  isWorkspaceMenuOpen: false,
  workspaceDetailsWorkspaceId: null,
  setActiveBoardId: (value) =>
    set((state) => ({
      activeBoardId: resolveValue(value, state.activeBoardId),
    })),
  setActiveWorkspaceId: (value) =>
    set((state) => ({
      activeWorkspaceId: resolveValue(value, state.activeWorkspaceId),
    })),
  setCardDetailModalState: (value) =>
    set((state) => ({
      cardDetailModalState: resolveValue(value, state.cardDetailModalState),
    })),
  setCreateListRequestId: (value) =>
    set((state) => ({
      createListRequestId: resolveValue(value, state.createListRequestId),
    })),
  setIsAccountMenuOpen: (value) =>
    set((state) => ({
      isAccountMenuOpen: resolveValue(value, state.isAccountMenuOpen),
    })),
  setIsAccountSettingsModalOpen: (value) =>
    set((state) => ({
      isAccountSettingsModalOpen: resolveValue(
        value,
        state.isAccountSettingsModalOpen,
      ),
    })),
  setIsBoardActivityModalOpen: (value) =>
    set((state) => ({
      isBoardActivityModalOpen: resolveValue(value, state.isBoardActivityModalOpen),
    })),
  setIsBoardMembersModalOpen: (value) =>
    set((state) => ({
      isBoardMembersModalOpen: resolveValue(value, state.isBoardMembersModalOpen),
    })),
  setIsBoardSettingsModalOpen: (value) =>
    set((state) => ({
      isBoardSettingsModalOpen: resolveValue(value, state.isBoardSettingsModalOpen),
    })),
  setIsCreateBoardModalOpen: (value) =>
    set((state) => ({
      isCreateBoardModalOpen: resolveValue(value, state.isCreateBoardModalOpen),
    })),
  setIsCreateWorkspaceModalOpen: (value) =>
    set((state) => ({
      isCreateWorkspaceModalOpen: resolveValue(
        value,
        state.isCreateWorkspaceModalOpen,
      ),
    })),
  setIsJoinWorkspaceModalOpen: (value) =>
    set((state) => ({
      isJoinWorkspaceModalOpen: resolveValue(value, state.isJoinWorkspaceModalOpen),
    })),
  setIsSidebarOpen: (value) =>
    set((state) => ({
      isSidebarOpen: resolveValue(value, state.isSidebarOpen),
    })),
  setIsWorkspaceMenuOpen: (value) =>
    set((state) => ({
      isWorkspaceMenuOpen: resolveValue(value, state.isWorkspaceMenuOpen),
    })),
  setWorkspaceDetailsWorkspaceId: (value) =>
    set((state) => ({
      workspaceDetailsWorkspaceId: resolveValue(
        value,
        state.workspaceDetailsWorkspaceId,
      ),
    })),
}));
