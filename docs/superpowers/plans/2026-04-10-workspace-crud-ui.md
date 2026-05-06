# Workspace CRUD UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dashboard workspace CRUD UI with empty-state handling, create/details modals, local workspace state, validation, and deletion safeguards, ready for later backend integration.

**Architecture:** The dashboard shell becomes the source of truth for workspace state, modal state, and active workspace selection. The sidebar becomes a presentational consumer of workspace state, while dedicated modal components own create/edit/delete interactions. Mock board data remains temporarily, but workspace data is removed from the shared dummy data file and replaced with a typed local workspace state model aligned to the Prisma `Workspace` schema.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, lucide-react, ESLint

---

## File Structure

### Create
- `apps/web/src/components/dashboard/workspace-types.ts` - Workspace domain types for the dashboard UI slice, plus form state and activity placeholder types.
- `apps/web/src/components/dashboard/workspace-utils.ts` - Slug generation, name normalization, validation helpers, date formatting helpers, and deletion confirmation helpers.
- `apps/web/src/components/dashboard/create-workspace-modal.tsx` - Dark themed create workspace modal with validation and submit/cancel states.
- `apps/web/src/components/dashboard/workspace-details-modal.tsx` - Tabbed workspace details modal with Overview and Activity tabs, edit flow, members placeholder section, and delete confirmation area.

### Modify
- `apps/web/src/components/dashboard/dashboard-shell.tsx` - Replace dummy workspace state with local workspace CRUD state and modal orchestration.
- `apps/web/src/components/dashboard/dashboard-sidebar.tsx` - Render empty state vs switcher state, wire info actions, and route create/details events upward.
- `apps/web/src/components/dashboard/dashboard-types.ts` - Remove `WorkspaceItem` and `workspaceItems` from dummy data while keeping temporary board/kanban mocks intact.

### Test / Verify
- `apps/web/src/components/dashboard/workspace-utils.ts` via ad hoc node assertions in plan steps
- UI files via `pnpm --filter web exec eslint ...`
- end-to-end compile safety via `pnpm --filter web build`

### Notes
- The current repo does not have an existing web component test harness. This plan therefore starts by creating a tiny pure-logic utility module with deterministic validation/slug logic that can be verified in isolation before wiring UI. That gives us a real red/green cycle for the critical form rules even before full UI test coverage is added later.

### Task 1: Create The Workspace Domain Utilities

**Files:**
- Create: `apps/web/src/components/dashboard/workspace-types.ts`
- Create: `apps/web/src/components/dashboard/workspace-utils.ts`
- Verify: `apps/web/src/components/dashboard/workspace-utils.ts`

- [ ] **Step 1: Write the failing utility verification command**

Run this command before the files exist:

```bash
node -e "import('./apps/web/src/components/dashboard/workspace-utils.ts').then((mod) => console.log(mod.slugifyWorkspaceName('Product Ops')));"
```

Expected: FAIL with a module resolution error because `workspace-utils.ts` does not exist yet.

- [ ] **Step 2: Create the workspace type definitions**

Write this file:

```ts
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
```

- [ ] **Step 3: Create the workspace utility module**

Write this file:

```ts
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
```

- [ ] **Step 4: Run a red/green utility verification script**

Run:

```bash
node -e "import('./apps/web/src/components/dashboard/workspace-utils.ts').then((mod) => { if (mod.normalizeWorkspaceName('  Product   Ops  ') !== 'Product Ops') throw new Error('normalizeWorkspaceName failed'); if (mod.slugifyWorkspaceName('Product Ops!') !== 'product-ops') throw new Error('slugifyWorkspaceName failed'); if (mod.validateWorkspaceName(' ') !== 'Workspace name is required.') throw new Error('required validation failed'); if (mod.validateWorkspaceName('A') !== 'Workspace name must be at least 2 characters.') throw new Error('minimum length validation failed'); if (!mod.canDeleteWorkspace('delete permanently')) throw new Error('delete confirmation check failed'); });"
```

Expected: PASS with no output.

- [ ] **Step 5: Commit the utility foundation**

```bash
git add apps/web/src/components/dashboard/workspace-types.ts apps/web/src/components/dashboard/workspace-utils.ts
git commit -m "feat: add workspace ui utility primitives"
```

### Task 2: Remove Dummy Workspace Data And Lift Real Workspace UI State Into The Shell

**Files:**
- Modify: `apps/web/src/components/dashboard/dashboard-types.ts`
- Modify: `apps/web/src/components/dashboard/dashboard-shell.tsx`
- Verify: `apps/web/src/components/dashboard/dashboard-shell.tsx`

- [ ] **Step 1: Write the failing shell verification expectation**

Before editing, note the current incorrect behavior to remove:

- the shell imports `workspaceItems` from `dashboard-types.ts`
- the shell always assumes at least one workspace exists
- the workspace state shape only includes `id` and `name`

This is the failing requirement state for the spec because the UI cannot render an empty no-workspace sidebar.

- [ ] **Step 2: Remove the dummy workspace exports from the shared mock data file**

Delete this block from `apps/web/src/components/dashboard/dashboard-types.ts`:

```ts
export type WorkspaceItem = {
  id: string;
  name: string;
};

export const workspaceItems: WorkspaceItem[] = [
  { id: "collability", name: "Collability" },
  { id: "studio-labs", name: "Studio Labs" },
  { id: "product-ops", name: "Product Ops" },
];
```

Keep the board and kanban mock exports unchanged.

- [ ] **Step 3: Replace shell workspace state with a real local workspace slice**

Update `apps/web/src/components/dashboard/dashboard-shell.tsx` to use the new workspace types and an internal starter array instead of `workspaceItems` from the dummy file.

Use this structure at the top of the file:

```ts
import { boardItems } from "./dashboard-types";
import {
  type WorkspaceActivityItem,
  type WorkspaceSummary,
} from "./workspace-types";

const initialWorkspaces: WorkspaceSummary[] = [];
const initialWorkspaceActivity: Record<string, WorkspaceActivityItem[]> = {};
```

Then replace the workspace state section with:

```ts
const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(initialWorkspaces);
const [workspaceActivityById, setWorkspaceActivityById] = useState<Record<string, WorkspaceActivityItem[]>>(initialWorkspaceActivity);
const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(initialWorkspaces[0]?.id ?? "");
const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
const [workspaceDetailsWorkspaceId, setWorkspaceDetailsWorkspaceId] = useState<string | null>(null);
```

And derive the active workspace with:

```ts
const activeWorkspace =
  workspaces.find((item) => item.id === activeWorkspaceId) ?? null;

const workspaceDetailsWorkspace =
  workspaces.find((item) => item.id === workspaceDetailsWorkspaceId) ?? null;
```

- [ ] **Step 4: Add shell CRUD handlers with local-state-only behavior**

In `dashboard-shell.tsx`, add these handler shapes:

```ts
function handleCreateWorkspace(workspace: WorkspaceSummary) {
  setWorkspaces((current) => [...current, workspace]);
  setWorkspaceActivityById((current) => ({
    ...current,
    [workspace.id]: [],
  }));
  setActiveWorkspaceId(workspace.id);
  setIsCreateWorkspaceModalOpen(false);
  setIsWorkspaceMenuOpen(false);
}

function handleUpdateWorkspace(workspaceId: string, updates: Pick<WorkspaceSummary, "name" | "slug" | "updatedAt">) {
  setWorkspaces((current) =>
    current.map((workspace) =>
      workspace.id === workspaceId ? { ...workspace, ...updates } : workspace,
    ),
  );
}

function handleDeleteWorkspace(workspaceId: string) {
  setWorkspaces((current) => {
    const remaining = current.filter((workspace) => workspace.id !== workspaceId);
    setActiveWorkspaceId((previous) => {
      if (previous !== workspaceId) {
        return previous;
      }

      return remaining[0]?.id ?? "";
    });
    return remaining;
  });

  setWorkspaceActivityById((current) => {
    const next = { ...current };
    delete next[workspaceId];
    return next;
  });

  setWorkspaceDetailsWorkspaceId(null);
  setIsWorkspaceMenuOpen(false);
}
```

- [ ] **Step 5: Run shell lint verification**

Run:

```bash
pnpm --filter web exec eslint src/components/dashboard/dashboard-shell.tsx src/components/dashboard/dashboard-types.ts
```

Expected: PASS with no lint errors.

- [ ] **Step 6: Commit the shell state conversion**

```bash
git add apps/web/src/components/dashboard/dashboard-shell.tsx apps/web/src/components/dashboard/dashboard-types.ts
git commit -m "refactor: move workspace state into dashboard shell"
```

### Task 3: Build The Create Workspace Modal

**Files:**
- Create: `apps/web/src/components/dashboard/create-workspace-modal.tsx`
- Modify: `apps/web/src/components/dashboard/dashboard-shell.tsx`
- Verify: `apps/web/src/components/dashboard/create-workspace-modal.tsx`

- [ ] **Step 1: Write the failing modal import check**

Run before creating the modal:

```bash
node -e "import('./apps/web/src/components/dashboard/create-workspace-modal.tsx')"
```

Expected: FAIL because the file does not exist yet.

- [ ] **Step 2: Create the modal component with local validation**

Create `apps/web/src/components/dashboard/create-workspace-modal.tsx` using this shape:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import type { WorkspaceSummary } from "./workspace-types";
import {
  normalizeWorkspaceName,
  slugifyWorkspaceName,
  validateWorkspaceName,
} from "./workspace-utils";

type CreateWorkspaceModalProps = {
  createdBy: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (workspace: WorkspaceSummary) => void;
};

export function CreateWorkspaceModal({
  createdBy,
  isOpen,
  onClose,
  onSubmit,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const error = useMemo(() => validateWorkspaceName(name), [name]);
  const slugPreview = useMemo(() => slugifyWorkspaceName(name), [name]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#111111] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#6f6f6a]">
              Workspace
            </p>
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#f5f5f3]">
                Create workspace
              </h2>
              <p className="mt-1 text-sm text-[#8b8b87]">
                Workspaces group your boards, members, and activity in one place.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#ecece8]">
                Workspace name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Product Ops"
                className="w-full rounded-[14px] border border-white/10 bg-[#171717] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d66c12]/70"
              />
            </label>

            {slugPreview ? (
              <p className="text-xs text-[#7f7f7a]">
                Slug: <span className="text-[#b8b8b3]">{slugPreview}</span>
              </p>
            ) : null}

            {error ? (
              <p className="text-xs text-[#f07f6a]">{error}</p>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[12px] px-4 py-2 text-sm text-[#bdbdb8] transition hover:bg-white/6 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(error) || isSubmitting}
                className="rounded-[12px] bg-[#d66c12] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#e07a1f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create workspace"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

Add an async `handleSubmit` above the return that:

```ts
const now = new Date().toISOString();
const normalizedName = normalizeWorkspaceName(name);

onSubmit({
  id: crypto.randomUUID(),
  name: normalizedName,
  slug: slugifyWorkspaceName(normalizedName),
  createdBy,
  createdAt: now,
  updatedAt: now,
});
```

- [ ] **Step 3: Mount the create modal from the shell**

At the end of `dashboard-shell.tsx`, render:

```tsx
<CreateWorkspaceModal
  createdBy={userName}
  isOpen={isCreateWorkspaceModalOpen}
  onClose={() => setIsCreateWorkspaceModalOpen(false)}
  onSubmit={handleCreateWorkspace}
/>
```

Also pass `onCreateWorkspace={() => setIsCreateWorkspaceModalOpen(true)}` into the sidebar props.

- [ ] **Step 4: Run lint on the modal wiring**

Run:

```bash
pnpm --filter web exec eslint src/components/dashboard/create-workspace-modal.tsx src/components/dashboard/dashboard-shell.tsx
```

Expected: PASS with no lint errors.

- [ ] **Step 5: Commit the create modal slice**

```bash
git add apps/web/src/components/dashboard/create-workspace-modal.tsx apps/web/src/components/dashboard/dashboard-shell.tsx
git commit -m "feat: add create workspace modal"
```

### Task 4: Rework The Sidebar For Empty State, Real Switching, And Details Entry

**Files:**
- Modify: `apps/web/src/components/dashboard/dashboard-sidebar.tsx`
- Modify: `apps/web/src/components/dashboard/dashboard-shell.tsx`
- Verify: `apps/web/src/components/dashboard/dashboard-sidebar.tsx`

- [ ] **Step 1: Write the failing UI requirement list**

Before editing, the sidebar fails the spec because:
- it cannot render `+ Create workspace` when no workspaces exist
- it requires `activeWorkspace` to exist
- the row info affordance is decorative only
- the dropdown create action does not open the modal

- [ ] **Step 2: Change the sidebar prop contract**

Update the sidebar props to:

```ts
type DashboardSidebarProps = {
  accountMenuRef: React.RefObject<HTMLDivElement | null>;
  activeBoard: BoardItem;
  activeWorkspace: WorkspaceSummary | null;
  boardItems: BoardItem[];
  isAccountMenuOpen: boolean;
  isSidebarOpen: boolean;
  isWorkspaceMenuOpen: boolean;
  onAccountMenuToggle: () => void;
  onBoardSelect: (boardId: string) => void;
  onCreateWorkspace: () => void;
  onOpenWorkspaceDetails: (workspaceId: string) => void;
  onWorkspaceMenuToggle: () => void;
  onWorkspaceSelect: (workspaceId: string) => void;
  userInitials: string;
  userName: string;
  workspaceItems: WorkspaceSummary[];
  workspaceMenuRef: React.RefObject<HTMLDivElement | null>;
};
```

- [ ] **Step 3: Render the no-workspaces inline state**

Replace the switcher block with a conditional:

```tsx
{workspaceItems.length === 0 ? (
  <button
    type="button"
    onClick={onCreateWorkspace}
    className="text-left text-[13px] font-medium text-[#d6d6d3] transition hover:text-white"
  >
    + Create workspace
  </button>
) : (
  // existing switcher card and dropdown
)}
```

Inside the populated dropdown:
- make the bottom `Create workspace` action call `onCreateWorkspace`
- make the info icon button explicit and clickable:

```tsx
<button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    onOpenWorkspaceDetails(workspace.id);
  }}
  className="ml-3 rounded-md p-1 text-[#767676] opacity-0 transition group-hover:opacity-100 hover:bg-white/6 hover:text-white"
>
  <Info className="h-3.5 w-3.5" />
</button>
```

- [ ] **Step 4: Wire the shell callbacks into the sidebar**

Pass:

```tsx
onCreateWorkspace={() => setIsCreateWorkspaceModalOpen(true)}
onOpenWorkspaceDetails={(workspaceId) => {
  setWorkspaceDetailsWorkspaceId(workspaceId);
  setIsWorkspaceMenuOpen(false);
}}
```

- [ ] **Step 5: Run sidebar lint verification**

Run:

```bash
pnpm --filter web exec eslint src/components/dashboard/dashboard-sidebar.tsx src/components/dashboard/dashboard-shell.tsx
```

Expected: PASS with no lint errors.

- [ ] **Step 6: Commit the sidebar workspace UX**

```bash
git add apps/web/src/components/dashboard/dashboard-sidebar.tsx apps/web/src/components/dashboard/dashboard-shell.tsx
git commit -m "feat: add workspace empty state and details entry"
```

### Task 5: Build The Workspace Details Modal

**Files:**
- Create: `apps/web/src/components/dashboard/workspace-details-modal.tsx`
- Modify: `apps/web/src/components/dashboard/dashboard-shell.tsx`
- Verify: `apps/web/src/components/dashboard/workspace-details-modal.tsx`

- [ ] **Step 1: Write the failing modal import check**

Run before creating the file:

```bash
node -e "import('./apps/web/src/components/dashboard/workspace-details-modal.tsx')"
```

Expected: FAIL because the file does not exist yet.

- [ ] **Step 2: Create the tabbed details modal**

Create `apps/web/src/components/dashboard/workspace-details-modal.tsx` with props:

```ts
type WorkspaceDetailsModalProps = {
  activityItems: WorkspaceActivityItem[];
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onUpdateWorkspace: (workspaceId: string, updates: Pick<WorkspaceSummary, "name" | "slug" | "updatedAt">) => void;
  workspace: WorkspaceSummary | null;
};
```

The component should:
- return `null` when `!isOpen || !workspace`
- keep local tab state (`overview` / `activity`)
- keep editable name state synced from `workspace`
- use `validateWorkspaceName`, `slugifyWorkspaceName`, `formatWorkspaceDate`, and `canDeleteWorkspace`
- show metadata fields for name, slug, created by, created at
- show a members placeholder section with clear `coming next` style copy
- show an activity tab empty state or placeholder list using `activityItems`
- show a danger zone with delete confirmation input and exact phrase enforcement

- [ ] **Step 3: Mount and wire the details modal in the shell**

Render:

```tsx
<WorkspaceDetailsModal
  activityItems={workspaceDetailsWorkspace ? workspaceActivityById[workspaceDetailsWorkspace.id] ?? [] : []}
  currentUserName={userName}
  isOpen={workspaceDetailsWorkspaceId !== null}
  onClose={() => setWorkspaceDetailsWorkspaceId(null)}
  onDeleteWorkspace={handleDeleteWorkspace}
  onUpdateWorkspace={handleUpdateWorkspace}
  workspace={workspaceDetailsWorkspace}
/>
```

- [ ] **Step 4: Run lint verification for the details modal**

Run:

```bash
pnpm --filter web exec eslint src/components/dashboard/workspace-details-modal.tsx src/components/dashboard/dashboard-shell.tsx
```

Expected: PASS with no lint errors.

- [ ] **Step 5: Commit the details modal**

```bash
git add apps/web/src/components/dashboard/workspace-details-modal.tsx apps/web/src/components/dashboard/dashboard-shell.tsx
git commit -m "feat: add workspace details modal"
```

### Task 6: Final Integration Verification

**Files:**
- Modify: `apps/web/src/components/dashboard/dashboard-shell.tsx` if minor integration fixes are needed
- Verify: dashboard workspace UI files
- Verify: `pnpm --filter web build`

- [ ] **Step 1: Run the full dashboard lint pass**

Run:

```bash
pnpm --filter web exec eslint src/components/dashboard/dashboard-shell.tsx src/components/dashboard/dashboard-sidebar.tsx src/components/dashboard/dashboard-topbar.tsx src/components/dashboard/create-workspace-modal.tsx src/components/dashboard/workspace-details-modal.tsx src/components/dashboard/workspace-types.ts src/components/dashboard/workspace-utils.ts src/components/dashboard/dashboard-types.ts
```

Expected: PASS with no lint errors.

- [ ] **Step 2: Run the production build**

Run:

```bash
pnpm --filter web build
```

Expected: PASS with successful Next.js compile and static route generation.

- [ ] **Step 3: Manual verification checklist**

Verify in the running app that:
- the sidebar shows `+ Create workspace` when the workspace array is empty
- the create modal opens from the inline empty state
- invalid workspace names show inline validation and block submission
- creating a workspace replaces the empty state with the switcher
- clicking the switcher opens the workspace list
- clicking the info action opens the details modal for the selected workspace
- the Overview tab allows renaming the workspace
- the Activity tab renders without breaking layout
- delete is disabled until `delete permanently` is typed exactly
- deleting the last workspace returns to the empty sidebar state

- [ ] **Step 4: Commit the final integrated workspace UI**

```bash
git add apps/web/src/components/dashboard/dashboard-shell.tsx apps/web/src/components/dashboard/dashboard-sidebar.tsx apps/web/src/components/dashboard/dashboard-topbar.tsx apps/web/src/components/dashboard/create-workspace-modal.tsx apps/web/src/components/dashboard/workspace-details-modal.tsx apps/web/src/components/dashboard/workspace-types.ts apps/web/src/components/dashboard/workspace-utils.ts apps/web/src/components/dashboard/dashboard-types.ts
git commit -m "feat: implement workspace crud dashboard ui"
```
