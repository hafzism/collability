const MIN_WORKSPACE_NAME_LENGTH = 2;
const MAX_WORKSPACE_NAME_LENGTH = 48;
const DELETE_CONFIRMATION_TEXT = "delete permanently";

export function normalizeWorkspaceName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function slugifyWorkspaceName(value: string) {
  return normalizeWorkspaceName(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateWorkspaceName(value: string) {
  const normalized = normalizeWorkspaceName(value);

  if (!normalized) {
    return "Workspace name is required.";
  }

  if (normalized.length < MIN_WORKSPACE_NAME_LENGTH) {
    return "Workspace name must be at least 2 characters.";
  }

  if (normalized.length > MAX_WORKSPACE_NAME_LENGTH) {
    return "Workspace name must be 48 characters or less.";
  }

  return undefined;
}

export function canDeleteWorkspace(value: string) {
  return value.trim() === DELETE_CONFIRMATION_TEXT;
}

export function formatWorkspaceDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export const workspaceConstraints = {
  minNameLength: MIN_WORKSPACE_NAME_LENGTH,
  maxNameLength: MAX_WORKSPACE_NAME_LENGTH,
  deleteConfirmationText: DELETE_CONFIRMATION_TEXT,
} as const;
