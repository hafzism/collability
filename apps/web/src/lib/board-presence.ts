"use client";

export type BoardPresenceStatus =
  | "active"
  | "viewing_card"
  | "typing_comment"
  | "editing_card";

export type BoardPresenceUser = {
  userId: string;
  email: string;
  name: string;
  status: BoardPresenceStatus;
  viewingCardId: string | null;
  editingCardId: string | null;
  typingCardId: string | null;
  updatedAt: string;
};

export type BoardPresenceSnapshot = {
  boardId: string;
  users: BoardPresenceUser[];
};

export type BoardPresenceUpdate = {
  boardId: string;
  viewingCardId?: string | null;
  editingCardId?: string | null;
  typingCardId?: string | null;
};

export type CardPresenceSummary = {
  viewers: BoardPresenceUser[];
  editors: BoardPresenceUser[];
  typers: BoardPresenceUser[];
};

export function getCardPresenceSummary(
  snapshot: BoardPresenceSnapshot | null,
  cardId: string,
  currentUserId?: string,
): CardPresenceSummary {
  const users = (snapshot?.users ?? []).filter(
    (user) => user.userId !== currentUserId,
  );

  return {
    viewers: users.filter(
      (user) => user.viewingCardId === cardId && user.editingCardId !== cardId,
    ),
    editors: users.filter((user) => user.editingCardId === cardId),
    typers: users.filter((user) => user.typingCardId === cardId),
  };
}
