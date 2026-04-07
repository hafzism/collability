export type BoardItem = {
  id: string;
  name: string;
};

export type WorkspaceItem = {
  id: string;
  name: string;
};

export const boardItems: BoardItem[] = [
  { id: "projects", name: "Projects" },
  { id: "planning", name: "Planning" },
  { id: "product-design", name: "Product Design" },
];

export const workspaceItems: WorkspaceItem[] = [
  { id: "collability", name: "Collability" },
  { id: "studio-labs", name: "Studio Labs" },
  { id: "product-ops", name: "Product Ops" },
];
