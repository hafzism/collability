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

export type BoardLabel = {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: string;
};

export type BoardDetail = BoardSummary & {
  currentUserBoardRole: BoardRole;
  labels: BoardLabel[];
  members: BoardMember[];
};

export type BoardActivityItem = {
  id: string;
  label: string;
  timestamp: string;
};

export type BoardList = {
  id: string;
  boardId: string;
  title: string;
  position: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BoardCardAssignee = {
  id: string;
  cardId: string;
  userId: string;
  assignedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type BoardCardLabel = {
  id: string;
  cardId: string;
  labelId: string;
  label: BoardLabel;
};

export type BoardCard = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: string;
  dueDate: string | null;
  createdBy: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  assignees: BoardCardAssignee[];
  labels: BoardCardLabel[];
  _count: {
    comments: number;
  };
};

export type BoardCardComment = {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type BoardCardDetail = BoardCard & {
  creator: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  comments: BoardCardComment[];
  list: {
    id: string;
    title: string;
    boardId: string;
  };
};

export type BoardCardActivityItem = {
  id: string;
  label: string;
  timestamp: string;
};
