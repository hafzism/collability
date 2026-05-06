# Workspace CRUD Dashboard Design

**Date:** 2026-04-10

## Goal

Replace the dashboard's dummy workspace data and static switcher behavior with a production-ready workspace management UI that supports workspace CRUD, workspace switching, metadata display, and a future-safe modal structure for members and activity.

This spec covers the **frontend UX and architecture for workspace CRUD only**. Backend integration will follow in the next implementation step. Members, roles, and full activity logging are intentionally deferred.

## Scope

### In scope

- Remove dummy workspace switcher assumptions from the dashboard workspace UX
- Add an empty state when the user has no workspaces
- Add a dark themed `Create workspace` modal
- Add a dark themed `Workspace details` modal
- Support workspace switching UI
- Support workspace create/edit/delete UI flows
- Show workspace metadata in the details modal
- Add a separate `Activity` tab shell inside the details modal
- Add frontend validation for workspace creation and editing
- Structure the frontend state so the backend can be connected cleanly next

### Out of scope

- Backend API integration
- Persisting workspaces to the database
- Full member invitation flow
- Role management
- Permission enforcement beyond the assumed current-user ownership context
- Full activity log implementation
- Full board CRUD implementation

## Existing Context

The current dashboard shell is powered by static data in [apps/web/src/components/dashboard/dashboard-types.ts](/home/hafeez/projects/collability/apps/web/src/components/dashboard/dashboard-types.ts). The workspace switcher in [apps/web/src/components/dashboard/dashboard-sidebar.tsx](/home/hafeez/projects/collability/apps/web/src/components/dashboard/dashboard-sidebar.tsx) currently assumes workspaces exist and uses dummy items. The shell state in [apps/web/src/components/dashboard/dashboard-shell.tsx](/home/hafeez/projects/collability/apps/web/src/components/dashboard/dashboard-shell.tsx) also assumes a preselected workspace.

The Prisma schema already defines the real workspace domain in [packages/database/prisma/schema.prisma](/home/hafeez/projects/collability/packages/database/prisma/schema.prisma):

- `Workspace`: `id`, `name`, `slug`, `createdBy`, `createdAt`, `updatedAt`
- `WorkspaceMember`
- `ActivityLog`

That schema shape should drive the frontend contract we design now.

## Product Decisions

### Step sequencing

The work will be split into phases:

1. Workspace CRUD UI and architecture
2. Workspace backend integration
3. Members and roles
4. Boards connected to workspace context

This keeps the first slice narrow and avoids coupling CRUD work to invitations, role rules, or board permissions too early.

### Workspace creation inputs

The create flow will accept `name` only.

- `slug` is auto-generated from the name
- slug is not user-editable in this phase
- slug may be shown read-only in the details modal

### Empty state behavior

If the user has no workspaces, the sidebar should show inline text:

`+ Create workspace`

This is intentionally not a primary button block. The goal is to keep the empty state visually light and consistent with the current sidebar style.

### Workspace details entry point

Each workspace entry in the switcher list keeps the existing info action affordance. Activating it opens a full modal rather than a tiny popover.

### Deletion confirmation

Deleting a workspace requires typed confirmation with the exact phrase:

`delete permanently`

The delete action remains disabled until the phrase matches exactly.

## UX Design

## 1. Sidebar Workspace States

### No workspaces

The sidebar header keeps the app brand. Under it, instead of the switcher card, show a single inline action line:

- `+ Create workspace`

Behavior:

- Clicking the line opens the create modal
- No dropdown is shown because there is nothing to switch between
- The board section should visually remain below, but the later board data layer will determine whether it is empty or hidden

### One or more workspaces

Show the current workspace switcher card.

Behavior:

- Clicking the card opens the workspace list dropdown
- Selecting a workspace changes the active workspace in frontend state
- Each row includes the info action to open the details modal for that workspace
- A `Create workspace` action remains available inside the dropdown

## 2. Create Workspace Modal

The modal is a centered popup with a dark/black surface aligned to the dashboard theme.

### Visual direction

- dark backdrop overlay
- dark modal panel with subtle border and depth
- typography and spacing aligned with the current dashboard chrome
- no light theme variant required for this phase

### Content

- title: `Create workspace`
- short supporting text explaining the workspace groups boards and collaboration
- one field: `Workspace name`
- read-only slug preview is optional; if shown, it should be secondary and non-editable

### Validation

Frontend validation should include:

- required name
- trimmed value cannot be empty
- collapse repeated outer whitespace by trimming leading/trailing spaces before submit
- sensible length bounds for name
- submit disabled while invalid
- submit disabled while request is pending

Validation copy should be concise and in-context, not toast-heavy.

### Actions

- `Cancel`
- `Create workspace`

### Submission behavior

For the UI-first phase:

- modal closes only on successful simulated completion or explicit cancel
- local dashboard state updates to include the new workspace
- newly created workspace becomes active

When backend wiring is added later, this same contract should map directly to the API success path.

## 3. Workspace Details Modal

The details modal opens from the workspace row info action.

It uses tabs to avoid cramming metadata, members, and destructive actions into one long panel.

### Tabs

- `Overview`
- `Activity`

### Overview tab

The overview tab contains three sections.

#### Workspace info

Shows and edits the core workspace record:

- editable `name`
- read-only `slug`
- `created by`
- `created at`

Behavior:

- editing name revalidates using the same rules as create
- save action is disabled unless there are changes and the input is valid

#### Members

This section is intentionally present now, but not fully implemented in Step 1.

It should:

- establish the final modal information architecture
- show a section heading and placeholder explanatory copy
- reserve space for member management in the next step

It should not pretend invitations or roles are already functional.

#### Danger zone

Contains workspace deletion.

Behavior:

- clear destructive styling
- typed confirmation input with exact phrase `delete permanently`
- delete remains disabled until confirmation matches
- destructive copy should make it clear this is permanent

### Activity tab

The `Activity` tab is included now as a structural shell.

In Step 1 it may show:

- an empty state such as `No activity yet`
- or a lightweight placeholder list shell

The important requirement is that the modal architecture already supports a dedicated activity surface, because the Prisma schema has `ActivityLog` and the user wants activity separated from workspace details.

## 4. Frontend State and Data Architecture

The current static dashboard types mix mock workspaces, mock boards, and kanban content. That is fine for the temporary kanban view, but it should not remain the source of truth for workspace UI.

### Required separation

Workspace UI should move toward a dedicated state layer with explicit responsibilities:

- workspace collection state
- active workspace id
- create modal open/close state
- workspace details modal open/close state
- selected workspace for details
- delete confirmation state
- pending UI states for create/update/delete

### Data model for the frontend slice

Workspace UI data should align with the backend schema fields needed now:

- `id`
- `name`
- `slug`
- `createdBy`
- `createdAt`
- optionally `updatedAt` for future edit display

The frontend should not depend on fake workspace-only types that will later be thrown away.

### Transitional strategy

Boards and kanban mock data may remain temporarily, but workspace data should stop coming from the current static dummy list. The workspace slice should become the first real source of dashboard state, even before backend integration.

## 5. Modal and Interaction Behavior

### Accessibility and usability

Both modals should support:

- focus trapping
- close on overlay click only if it will not discard destructive or in-progress actions unexpectedly
- close on `Escape` where safe
- clear disabled states for invalid submit actions
- visible inline validation messages

### Editing and deletion safeguards

- deleting the active workspace in local state should also define the next selected workspace behavior
- if the last workspace is deleted, the UI returns to the empty inline `+ Create workspace` state
- if a non-last workspace is deleted, the next available workspace becomes active

## 6. Recommended Component Boundaries

The implementation should prefer smaller focused units over further inflating the sidebar component.

Likely boundaries:

- dashboard shell container keeps top-level workspace state
- sidebar renders workspace section based on passed state
- dedicated create workspace modal component
- dedicated workspace details modal component
- small reusable input/section primitives only if the existing codebase already benefits from them

The goal is to avoid making `dashboard-sidebar.tsx` the permanent home for all CRUD logic.

## 7. Error Handling Strategy for the UI-First Phase

Before backend integration, error handling should be local and deterministic.

- validation errors are inline
- no fake network error simulation unless explicitly needed
- modal pending states should still exist so the async contract is realistic

When backend integration is added, async success/error hooks should slot into the same UI pathways rather than requiring a redesign.

## 8. Testing Expectations for the Next Implementation Step

The next implementation phase should verify:

- empty workspace state renders correctly
- create modal opens from inline empty state and dropdown action
- valid create adds and activates a workspace
- invalid create blocks submit
- details modal opens for a specific workspace
- edit updates the workspace in local state
- delete requires exact typed confirmation
- deleting the final workspace returns to the empty state
- deleting an active workspace selects a fallback workspace when available

## 9. Why This Design

This design gives us a strong UI and state architecture before backend wiring.

It avoids two common traps:

- building a static modal that has to be rewritten once real data arrives
- overreaching into members, roles, and activity implementation before the CRUD foundation is stable

The result is a narrow first slice that is honest about scope while still shaping the final product architecture correctly.
