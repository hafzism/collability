import { BoardEventsService } from './board-events.service';

describe('BoardEventsService', () => {
  it('does not throw when no socket server has been bound yet', () => {
    const service = new BoardEventsService();

    expect(() =>
      service.emitBoardEvent({
        boardId: 'board-1',
        type: 'card.created',
        actorUserId: 'user-1',
      }),
    ).not.toThrow();
  });

  it('emits board events to the matching board room', () => {
    const service = new BoardEventsService();
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });

    service.bindServer({ to } as any);
    service.emitBoardEvent({
      boardId: 'board-1',
      type: 'card.created',
      actorUserId: 'user-1',
      entity: {
        type: 'card',
        id: 'card-1',
      },
      affectedListIds: ['list-1'],
    });

    expect(to).toHaveBeenCalledWith('board:board-1');
    expect(emit).toHaveBeenCalledWith(
      'board:event',
      expect.objectContaining({
        boardId: 'board-1',
        type: 'card.created',
        actorUserId: 'user-1',
        entity: {
          type: 'card',
          id: 'card-1',
        },
        affectedListIds: ['list-1'],
        timestamp: expect.any(String),
      }),
    );
  });
});
