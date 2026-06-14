export type BoardEventType =
  | 'board.updated'
  | 'board.deleted'
  | 'board.label_created'
  | 'board.member_added'
  | 'board.member_removed'
  | 'board.member_role_changed'
  | 'list.created'
  | 'list.updated'
  | 'list.reordered'
  | 'list.deleted'
  | 'card.created'
  | 'card.updated'
  | 'card.reordered'
  | 'card.moved'
  | 'card.deleted'
  | 'card.comment_created';

export type BoardEventEntity = {
  type: 'board' | 'list' | 'card' | 'comment' | 'label' | 'member';
  id: string;
};

export type BoardEventPayload = {
  boardId: string;
  type: BoardEventType;
  actorUserId: string;
  affectedListIds?: string[];
  cardId?: string;
  entity?: BoardEventEntity;
  listId?: string;
  targetListId?: string;
  timestamp?: string;
  workspaceId?: string;
};
