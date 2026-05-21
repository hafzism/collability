import type {
  BoardCard,
  BoardLabel,
  BoardList,
  BoardMember,
} from "../board-types";

export type CardsByListId = Record<string, BoardCard[]>;

export type DraftCard = {
  position: "top" | "bottom";
};

export type ActiveDrag =
  | {
      type: "card";
      cardId: string;
      sourceListId: string;
    }
  | {
      type: "list";
      listId: string;
    };

export type CardActionHandler = (input: {
  boardId: string;
  listId: string;
  cardId: string;
}) => void;

export type CreateBoardLabelHandler = (input: {
  boardId: string;
  name: string;
  color: string;
}) => Promise<BoardLabel | void>;

export type CreateCardHandler = (input: {
  boardId: string;
  listId: string;
  title: string;
  description?: string;
  dueDate?: string;
  labelIds?: string[];
  assigneeIds?: string[];
  position: "top" | "bottom";
}) => Promise<void>;

export const LIST_ITEM_PREFIX = "list:";
export const LIST_DROP_PREFIX = "list-drop:";
export const CARD_ITEM_PREFIX = "card:";
export const TOUCH_DRAG_DELAY = 300;

export function sortListsByPosition(items: BoardList[]) {
  return [...items].sort(
    (left, right) => Number(left.position) - Number(right.position),
  );
}

export function sortCardsByPosition(items: BoardCard[]) {
  return [...items].sort(
    (left, right) => Number(left.position) - Number(right.position),
  );
}

export function normalizeCardsByListId(
  lists: BoardList[],
  cardsByListId: CardsByListId,
): CardsByListId {
  return Object.fromEntries(
    lists.map((list) => [list.id, sortCardsByPosition(cardsByListId[list.id] ?? [])]),
  );
}

export function renumberLists(lists: BoardList[]) {
  return lists.map((list, index) => ({
    ...list,
    position: `${(index + 1) * 1000}`,
  }));
}

export function renumberCards(cards: BoardCard[], listId: string) {
  return cards.map((card, index) => ({
    ...card,
    listId,
    position: `${(index + 1) * 1000}`,
  }));
}

export function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function areCardOrdersEqual(left: BoardCard[], right: BoardCard[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((card, index) => card.id === right[index]?.id);
}

export function areListOrdersEqual(left: BoardList[], right: BoardList[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((list, index) => list.id === right[index]?.id);
}

export function areCardsByListEqual(
  left: CardsByListId,
  right: CardsByListId,
  listIds: string[],
) {
  return listIds.every((listId) =>
    areCardOrdersEqual(left[listId] ?? [], right[listId] ?? []),
  );
}

export function getCardItemId(cardId: string) {
  return `${CARD_ITEM_PREFIX}${cardId}`;
}

export function getListItemId(listId: string) {
  return `${LIST_ITEM_PREFIX}${listId}`;
}

export function getListDropId(listId: string) {
  return `${LIST_DROP_PREFIX}${listId}`;
}

export function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-no-dnd='true']"))
  );
}

export function getCardNeighbors(cards: BoardCard[], targetIndex: number) {
  return {
    beforeId: targetIndex > 0 ? cards[targetIndex - 1]?.id : undefined,
    afterId:
      targetIndex < cards.length - 1 ? cards[targetIndex + 1]?.id : undefined,
  };
}

export function findCardListId(cardsByListId: CardsByListId, cardId: string) {
  for (const [listId, cards] of Object.entries(cardsByListId)) {
    if (cards.some((card) => card.id === cardId)) {
      return listId;
    }
  }

  return null;
}

export function normalizeListTitle(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCardText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function formatDueDate(value: string | null) {
  if (!value) {
    return "Due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getSelectedLabels(
  boardLabels: BoardLabel[],
  labelIds: string[],
) {
  return boardLabels.filter((label) => labelIds.includes(label.id));
}

export function getSelectedMembers(
  boardMembers: BoardMember[],
  assigneeIds: string[],
) {
  return boardMembers.filter((member) => assigneeIds.includes(member.userId));
}
