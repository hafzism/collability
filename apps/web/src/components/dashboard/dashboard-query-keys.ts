export const dashboardQueryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
    sessions: ["auth", "sessions"] as const,
  },
  workspaces: {
    all: ["workspaces"] as const,
    detail: (workspaceId: string) =>
      ["workspaces", "detail", workspaceId] as const,
    activity: (workspaceId: string) =>
      ["workspaces", "activity", workspaceId] as const,
  },
  boards: {
    list: (workspaceId: string) =>
      ["workspaces", workspaceId, "boards"] as const,
    detail: (boardId: string) => ["boards", boardId, "detail"] as const,
    activity: (boardId: string) => ["boards", boardId, "activity"] as const,
    lists: (boardId: string) => ["boards", boardId, "lists"] as const,
  },
  notifications: {
    list: (boardId: string) => ["boards", boardId, "notifications"] as const,
    unreadCount: (boardId: string) =>
      ["boards", boardId, "notifications", "unread-count"] as const,
  },
  cards: {
    searchRoot: (boardId: string) => ["boards", boardId, "cards", "search"] as const,
    search: (boardId: string, filterKey: string) =>
      ["boards", boardId, "cards", "search", filterKey] as const,
    list: (boardId: string, listId: string) =>
      ["boards", boardId, "lists", listId, "cards"] as const,
    detail: (boardId: string, listId: string, cardId: string) =>
      ["boards", boardId, "lists", listId, "cards", cardId, "detail"] as const,
    activity: (boardId: string, listId: string, cardId: string) =>
      ["boards", boardId, "lists", listId, "cards", cardId, "activity"] as const,
  },
};
