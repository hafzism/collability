export type BoardVisibility = "WORKSPACE" | "PRIVATE";

export type BoardRole = "MANAGER" | "CONTRIBUTOR" | "VIEWER";

export type BoardSummary = {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  visibility: BoardVisibility;
  createdBy: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BoardMember = {
  id: string;
  boardId: string;
  userId: string;
  role: BoardRole;
  addedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type BoardDetail = BoardSummary & {
  currentUserBoardRole: BoardRole;
  members: BoardMember[];
};

export type BoardActivityItem = {
  id: string;
  label: string;
  timestamp: string;
};
