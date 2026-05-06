export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  joinCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentUserRole: WorkspaceRole;
};

export type WorkspaceMember = {
  id: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type WorkspaceDetail = WorkspaceSummary & {
  members: WorkspaceMember[];
};

export type WorkspaceActivityItem = {
  id: string;
  label: string;
  timestamp: string;
};

export type WorkspaceInviteResponse = {
  success: true;
  email: string;
  joinCode: string;
};

export type WorkspaceFormValues = {
  name: string;
};

export type WorkspaceFormErrors = {
  name?: string;
};
