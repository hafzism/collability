import { BoardPresenceService } from './board-presence.service';

describe('BoardPresenceService', () => {
  let service: BoardPresenceService;

  const user = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'User One',
  };

  beforeEach(() => {
    service = new BoardPresenceService();
  });

  it('tracks users after they enter a board', () => {
    const snapshot = service.enterBoard({
      boardId: 'board-1',
      socketId: 'socket-1',
      user,
    });

    expect(snapshot).toEqual({
      boardId: 'board-1',
      users: [
        expect.objectContaining({
          userId: 'user-1',
          email: 'user@example.com',
          name: 'User One',
          status: 'active',
          viewingCardId: null,
          editingCardId: null,
          typingCardId: null,
        }),
      ],
    });
  });

  it('aggregates multiple sockets for the same user', () => {
    service.enterBoard({
      boardId: 'board-1',
      socketId: 'socket-1',
      user,
    });
    service.enterBoard({
      boardId: 'board-1',
      socketId: 'socket-2',
      user,
    });

    const snapshot = service.leaveBoard({
      boardId: 'board-1',
      socketId: 'socket-1',
    });

    expect(snapshot.users).toHaveLength(1);
    expect(snapshot.users[0]).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        status: 'active',
      }),
    );
  });

  it('prioritizes editing over typing and viewing card states', () => {
    service.enterBoard({
      boardId: 'board-1',
      socketId: 'socket-1',
      user,
    });

    const snapshot = service.updatePresence({
      boardId: 'board-1',
      socketId: 'socket-1',
      viewingCardId: 'card-1',
      editingCardId: 'card-1',
      typingCardId: 'card-1',
    });

    expect(snapshot.users[0]).toEqual(
      expect.objectContaining({
        status: 'editing_card',
        viewingCardId: 'card-1',
        editingCardId: 'card-1',
        typingCardId: 'card-1',
      }),
    );
  });

  it('clears card-specific state with null updates', () => {
    service.enterBoard({
      boardId: 'board-1',
      socketId: 'socket-1',
      user,
    });
    service.updatePresence({
      boardId: 'board-1',
      socketId: 'socket-1',
      viewingCardId: 'card-1',
      editingCardId: 'card-1',
      typingCardId: 'card-1',
    });

    const snapshot = service.updatePresence({
      boardId: 'board-1',
      socketId: 'socket-1',
      viewingCardId: null,
      editingCardId: null,
      typingCardId: null,
    });

    expect(snapshot.users[0]).toEqual(
      expect.objectContaining({
        status: 'active',
        viewingCardId: null,
        editingCardId: null,
        typingCardId: null,
      }),
    );
  });

  it('removes a socket from every affected board on disconnect', () => {
    service.enterBoard({
      boardId: 'board-1',
      socketId: 'socket-1',
      user,
    });
    service.enterBoard({
      boardId: 'board-2',
      socketId: 'socket-1',
      user,
    });

    const snapshots = service.disconnectSocket('socket-1');

    expect(snapshots).toHaveLength(2);
    expect(snapshots).toEqual(
      expect.arrayContaining([
        { boardId: 'board-1', users: [] },
        { boardId: 'board-2', users: [] },
      ]),
    );
  });
});
