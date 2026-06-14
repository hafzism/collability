import { ForbiddenException } from '@nestjs/common';
import { BoardEventsGateway } from './board-events.gateway';
import { BoardEventsService } from './board-events.service';
import { BoardPresenceService } from './board-presence.service';
import { BoardRole } from '../common/enums/board-role.enum';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';

describe('BoardEventsGateway', () => {
  const boardEventsService = {
    bindServer: jest.fn(),
  };
  const boardPresenceService = {
    enterBoard: jest.fn(),
    updatePresence: jest.fn(),
    leaveBoard: jest.fn(),
    disconnectSocket: jest.fn(),
  };
  const jwtService = {
    verify: jest.fn(),
  };
  const usersService = {
    findById: jest.fn(),
  };
  const boardsService = {
    getBoardById: jest.fn(),
    getBoardMembership: jest.fn(),
  };
  const workspacesService = {
    getWorkspaceRole: jest.fn(),
  };

  let gateway: BoardEventsGateway;

  beforeEach(() => {
    jest.resetAllMocks();
    gateway = new BoardEventsGateway(
      boardEventsService as unknown as BoardEventsService,
      boardPresenceService as unknown as BoardPresenceService,
      jwtService as any,
      usersService as any,
      boardsService as any,
      workspacesService as any,
    );
  });

  it('authenticates socket connections with the access token from handshake auth', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      type: 'access',
      sid: 'session-1',
    });
    usersService.findById.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Hafeez',
    });
    const client = {
      data: {},
      disconnect: jest.fn(),
      join: jest.fn(),
      handshake: {
        auth: {
          token: 'access-token',
        },
        headers: {},
      },
    };

    await gateway.handleConnection(client as any);

    expect(client.disconnect).not.toHaveBeenCalled();
    expect(client.data.user).toEqual(
      expect.objectContaining({
        id: 'user-1',
      }),
    );
    expect(client.data.auth).toEqual({
      sessionId: 'session-1',
    });
    expect(client.join).toHaveBeenCalledWith('user:user-1');
  });

  it('allows workspace members to join workspace-visible board rooms', async () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const snapshot = {
      boardId: 'board-1',
      users: [],
    };
    gateway.afterInit({ to } as any);
    boardPresenceService.enterBoard.mockReturnValue(snapshot);
    boardsService.getBoardById.mockResolvedValue({
      id: 'board-1',
      workspaceId: 'workspace-1',
      createdBy: 'user-9',
      visibility: 'WORKSPACE',
    });
    workspacesService.getWorkspaceRole.mockResolvedValue(WorkspaceRole.MEMBER);
    boardsService.getBoardMembership.mockResolvedValue(null);
    const client = {
      id: 'socket-1',
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Hafeez',
        },
      },
      join: jest.fn(),
    };

    await expect(
      gateway.handleJoinBoard(client as any, { boardId: 'board-1' }),
    ).resolves.toEqual({
      boardId: 'board-1',
      room: 'board:board-1',
      role: BoardRole.VIEWER,
    });

    expect(client.join).toHaveBeenCalledWith('board:board-1');
    expect(boardPresenceService.enterBoard).toHaveBeenCalledWith({
      boardId: 'board-1',
      socketId: 'socket-1',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Hafeez',
      },
    });
    expect(to).toHaveBeenCalledWith('board:board-1');
    expect(emit).toHaveBeenCalledWith('board:presence', snapshot);
  });

  it('rejects private board rooms when the user is not a member or workspace admin', async () => {
    boardsService.getBoardById.mockResolvedValue({
      id: 'board-1',
      workspaceId: 'workspace-1',
      createdBy: 'user-9',
      visibility: 'PRIVATE',
    });
    workspacesService.getWorkspaceRole.mockResolvedValue(WorkspaceRole.MEMBER);
    boardsService.getBoardMembership.mockResolvedValue(null);
    const client = {
      data: {
        user: {
          id: 'user-1',
        },
      },
      join: jest.fn(),
    };

    await expect(
      gateway.handleJoinBoard(client as any, { boardId: 'board-1' }),
    ).rejects.toThrow(ForbiddenException);

    expect(client.join).not.toHaveBeenCalled();
  });

  it('broadcasts presence updates to the board room', async () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const snapshot = {
      boardId: 'board-1',
      users: [
        {
          userId: 'user-1',
          email: 'user@example.com',
          name: 'Hafeez',
          status: 'editing_card',
          viewingCardId: 'card-1',
          editingCardId: 'card-1',
          typingCardId: null,
          updatedAt: '2026-06-11T00:00:00.000Z',
        },
      ],
    };
    gateway.afterInit({ to } as any);
    boardPresenceService.updatePresence.mockReturnValue(snapshot);
    const client = {
      id: 'socket-1',
      data: {
        user: {
          id: 'user-1',
        },
      },
    };

    await expect(
      gateway.handlePresenceUpdate(client as any, {
        boardId: 'board-1',
        viewingCardId: 'card-1',
        editingCardId: 'card-1',
        typingCardId: null,
      }),
    ).resolves.toEqual(snapshot);

    expect(boardPresenceService.updatePresence).toHaveBeenCalledWith({
      boardId: 'board-1',
      socketId: 'socket-1',
      viewingCardId: 'card-1',
      editingCardId: 'card-1',
      typingCardId: null,
    });
    expect(to).toHaveBeenCalledWith('board:board-1');
    expect(emit).toHaveBeenCalledWith('board:presence', snapshot);
  });

  it('broadcasts presence after leaving a board', async () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const snapshot = {
      boardId: 'board-1',
      users: [],
    };
    gateway.afterInit({ to } as any);
    boardPresenceService.leaveBoard.mockReturnValue(snapshot);
    const client = {
      id: 'socket-1',
      data: {
        user: {
          id: 'user-1',
        },
      },
      leave: jest.fn(),
    };

    await expect(
      gateway.handleLeaveBoard(client as any, { boardId: 'board-1' }),
    ).resolves.toEqual({
      boardId: 'board-1',
      left: true,
    });

    expect(client.leave).toHaveBeenCalledWith('board:board-1');
    expect(boardPresenceService.leaveBoard).toHaveBeenCalledWith({
      boardId: 'board-1',
      socketId: 'socket-1',
    });
    expect(emit).toHaveBeenCalledWith('board:presence', snapshot);
  });

  it('broadcasts affected board snapshots after disconnect', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    const snapshots = [
      {
        boardId: 'board-1',
        users: [],
      },
      {
        boardId: 'board-2',
        users: [],
      },
    ];
    gateway.afterInit({ to } as any);
    boardPresenceService.disconnectSocket.mockReturnValue(snapshots);

    gateway.handleDisconnect({ id: 'socket-1' } as any);

    expect(boardPresenceService.disconnectSocket).toHaveBeenCalledWith('socket-1');
    expect(to).toHaveBeenCalledWith('board:board-1');
    expect(to).toHaveBeenCalledWith('board:board-2');
    expect(emit).toHaveBeenCalledWith('board:presence', snapshots[0]);
    expect(emit).toHaveBeenCalledWith('board:presence', snapshots[1]);
  });
});
