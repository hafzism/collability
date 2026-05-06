export type BoardItem = {
  id: string;
  name: string;
};

export type KanbanLabel = {
  id: string;
  name: string;
  color: string;
};

export type KanbanAssignee = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
};

export type KanbanCard = {
  id: string;
  title: string;
  dueDate: string;
  commentCount: number;
  labels: KanbanLabel[];
  assignees: KanbanAssignee[];
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type KanbanBoard = {
  boardId: string;
  boardTitle: string;
  columns: KanbanColumn[];
};

const hafeezAssignee: KanbanAssignee = {
  id: "hafeez",
  name: "Hafeez",
  initials: "H",
  avatarColor: "#d66c12",
};

const avaAssignee: KanbanAssignee = {
  id: "ava",
  name: "Ava",
  initials: "A",
  avatarColor: "#3a5568",
};

const noahAssignee: KanbanAssignee = {
  id: "noah",
  name: "Noah",
  initials: "N",
  avatarColor: "#5a3d76",
};

export const boardItems: BoardItem[] = [
  { id: "projects", name: "Projects" },
  { id: "planning", name: "Planning" },
  { id: "product-design", name: "Product Design" },
];

export const kanbanBoards: KanbanBoard[] = [
  {
    boardId: "projects",
    boardTitle: "Projects",
    columns: [
      {
        id: "backlog",
        title: "Backlog",
        cards: [
          {
            id: "card-intake-form",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-intake-form-2",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-intake-form-3",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-intake-form-4",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-intake-form-5",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-intake-form-6",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-intake-form-7",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-intake-form-8",
            title: "Create project intake form",
            dueDate: "Apr 14",
            commentCount: 4,
            labels: [{ id: "label-research", name: "Research", color: "#3a5568" }],
            assignees: [hafeezAssignee],
          },
          {
            id: "card-client-brief",
            title: "Organize client brief archive",
            dueDate: "Apr 18",
            commentCount: 2,
            labels: [{ id: "label-ops", name: "Ops", color: "#5d6b2f" }],
            assignees: [avaAssignee, noahAssignee],
          },
        ],
      },
      {
        id: "in-progress",
        title: "In Progress",
        cards: [
          {
            id: "card-dashboard-copy",
            title: "Refine dashboard empty states",
            dueDate: "Apr 11",
            commentCount: 7,
            labels: [{ id: "label-ui", name: "UI", color: "#875d1d" }],
            assignees: [hafeezAssignee, avaAssignee],
          },
          {
            id: "card-notifications",
            title: "Map notification settings flow",
            dueDate: "Apr 13",
            commentCount: 3,
            labels: [{ id: "label-product", name: "Product", color: "#6f4d87" }],
            assignees: [noahAssignee],
          },
        ],
      },
      {
        id: "review",
        title: "Review",
        cards: [
          {
            id: "card-permissions",
            title: "Review workspace permission copy",
            dueDate: "Apr 10",
            commentCount: 6,
            labels: [{ id: "label-copy", name: "Copy", color: "#4d6f69" }],
            assignees: [avaAssignee],
          },
        ],
      },
      {
        id: "done-primary",
        title: "Done",
        cards: [
          {
            id: "card-shell",
            title: "Ship dashboard shell foundation",
            dueDate: "Apr 8",
            commentCount: 9,
            labels: [{ id: "label-core", name: "Core", color: "#4f4f4f" }],
            assignees: [hafeezAssignee, noahAssignee],
          },
        ],
      },
      {
        id: "done-secondary",
        title: "Done",
        cards: [
          {
            id: "card-shell-2",
            title: "Ship dashboard shell foundation",
            dueDate: "Apr 8",
            commentCount: 9,
            labels: [{ id: "label-core", name: "Core", color: "#4f4f4f" }],
            assignees: [hafeezAssignee, noahAssignee],
          },
        ],
      },
      {
        id: "done-tertiary",
        title: "Done",
        cards: [
          {
            id: "card-shell-3",
            title: "Ship dashboard shell foundation",
            dueDate: "Apr 8",
            commentCount: 9,
            labels: [{ id: "label-core", name: "Core", color: "#4f4f4f" }],
            assignees: [hafeezAssignee, noahAssignee],
          },
        ],
      },
    ],
  },
  {
    boardId: "planning",
    boardTitle: "Planning",
    columns: [
      {
        id: "ideas",
        title: "Ideas",
        cards: [
          {
            id: "card-roadmap",
            title: "Sketch Q2 roadmap themes",
            dueDate: "Apr 16",
            commentCount: 5,
            labels: [{ id: "label-strategy", name: "Strategy", color: "#6b4e1d" }],
            assignees: [hafeezAssignee],
          },
        ],
      },
      {
        id: "drafting",
        title: "Drafting",
        cards: [
          {
            id: "card-capacity",
            title: "Estimate team capacity by sprint",
            dueDate: "Apr 15",
            commentCount: 1,
            labels: [{ id: "label-ops-plan", name: "Ops", color: "#4d6f69" }],
            assignees: [avaAssignee],
          },
        ],
      },
      {
        id: "approved",
        title: "Approved",
        cards: [
          {
            id: "card-goals",
            title: "Finalize launch milestone goals",
            dueDate: "Apr 12",
            commentCount: 8,
            labels: [{ id: "label-milestone", name: "Milestone", color: "#5a3d76" }],
            assignees: [noahAssignee],
          },
        ],
      },
    ],
  },
  {
    boardId: "product-design",
    boardTitle: "Product Design",
    columns: [
      {
        id: "queue",
        title: "Queue",
        cards: [
          {
            id: "card-kanban",
            title: "Design clean kanban card system",
            dueDate: "Apr 12",
            commentCount: 3,
            labels: [{ id: "label-design", name: "Design", color: "#875d1d" }],
            assignees: [hafeezAssignee],
          },
        ],
      },
      {
        id: "making",
        title: "Making",
        cards: [
          {
            id: "card-library",
            title: "Tune sidebar and topbar rhythm",
            dueDate: "Apr 11",
            commentCount: 6,
            labels: [{ id: "label-system", name: "System", color: "#3a5568" }],
            assignees: [avaAssignee, hafeezAssignee],
          },
        ],
      },
      {
        id: "handoff",
        title: "Handoff",
        cards: [
          {
            id: "card-spec",
            title: "Prepare interaction notes for detail drawer",
            dueDate: "Apr 19",
            commentCount: 2,
            labels: [{ id: "label-handoff", name: "Handoff", color: "#4f4f4f" }],
            assignees: [noahAssignee],
          },
        ],
      },
    ],
  },
];
