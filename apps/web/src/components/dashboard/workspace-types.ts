export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceActivityItem = {
  id: string;
  label: string;
  timestamp: string;
};

export type WorkspaceFormValues = {
  name: string;
};

export type WorkspaceFormErrors = {
  name?: string;
};
