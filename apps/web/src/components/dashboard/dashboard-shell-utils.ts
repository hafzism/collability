import type { BoardCard, BoardList } from "./board-types";

export function getSortedLists(lists: BoardList[]) {
  return [...lists].sort((left, right) => Number(left.position) - Number(right.position));
}

export function getSortedCards(cards: BoardCard[]) {
  return [...cards].sort((left, right) => Number(left.position) - Number(right.position));
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

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
