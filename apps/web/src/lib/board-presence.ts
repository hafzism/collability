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
