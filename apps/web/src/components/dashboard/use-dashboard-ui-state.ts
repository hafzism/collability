"use client";

import { useRef, useState } from "react";

import type { WorkspaceDetail } from "./workspace-types";

export type CardDetailModalState = {
  boardId: string;
  listId: string;
  cardId: string;
  initialTab: "details" | "comments";
};

export function useDashboardUiState() {
  const [createListRequestId, setCreateListRequestId] = useState(0);
  const [activeBoardId, setActiveBoardId] = useState("");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] =
    useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isBoardActivityModalOpen, setIsBoardActivityModalOpen] = useState(false);
  const [isBoardMembersModalOpen, setIsBoardMembersModalOpen] = useState(false);
  const [isBoardSettingsModalOpen, setIsBoardSettingsModalOpen] = useState(false);
  const [cardDetailModalState, setCardDetailModalState] =
    useState<CardDetailModalState | null>(null);
  const [isJoinWorkspaceModalOpen, setIsJoinWorkspaceModalOpen] = useState(false);
  const [workspaceDetailsWorkspaceId, setWorkspaceDetailsWorkspaceId] = useState<
    string | null
  >(null);
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetail | null>(
    null,
  );
  const [boardCreationWorkspaceDetail, setBoardCreationWorkspaceDetail] =
    useState<WorkspaceDetail | null>(null);
  const [boardManagementWorkspaceDetail, setBoardManagementWorkspaceDetail] =
    useState<WorkspaceDetail | null>(null);
  const [workspaceErrorMessage, setWorkspaceErrorMessage] = useState<string | null>(
    null,
  );

  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  return {
    accountMenuRef,
    activeBoardId,
    activeWorkspaceId,
    boardCreationWorkspaceDetail,
    boardManagementWorkspaceDetail,
    cardDetailModalState,
    createListRequestId,
    isAccountMenuOpen,
    isBoardActivityModalOpen,
    isBoardMembersModalOpen,
    isBoardSettingsModalOpen,
    isCreateBoardModalOpen,
    isCreateWorkspaceModalOpen,
    isJoinWorkspaceModalOpen,
    isSidebarOpen,
    isWorkspaceMenuOpen,
    setActiveBoardId,
    setActiveWorkspaceId,
    setBoardCreationWorkspaceDetail,
    setBoardManagementWorkspaceDetail,
    setCardDetailModalState,
    setCreateListRequestId,
    setIsAccountMenuOpen,
    setIsBoardActivityModalOpen,
    setIsBoardMembersModalOpen,
    setIsBoardSettingsModalOpen,
    setIsCreateBoardModalOpen,
    setIsCreateWorkspaceModalOpen,
    setIsJoinWorkspaceModalOpen,
    setIsSidebarOpen,
    setIsWorkspaceMenuOpen,
    setWorkspaceDetails,
    setWorkspaceDetailsWorkspaceId,
    setWorkspaceErrorMessage,
    workspaceDetails,
    workspaceDetailsWorkspaceId,
    workspaceErrorMessage,
    workspaceMenuRef,
  };
}
