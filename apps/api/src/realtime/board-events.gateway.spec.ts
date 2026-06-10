import { ForbiddenException } from '@nestjs/common';
import { BoardEventsGateway } from './board-events.gateway';
import { BoardEventsService } from './board-events.service';
import { BoardRole } from '../common/enums/board-role.enum';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';

describe('BoardEventsGateway', () => {
  const boardEventsService = {
    bindServer: jest.fn(),
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
  });

  it('allows workspace members to join workspace-visible board rooms', async () => {
    boardsService.getBoardById.mockResolvedValue({
      id: 'board-1',
      workspaceId: 'workspace-1',
      createdBy: 'user-9',
      visibility: 'WORKSPACE',
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
    ).resolves.toEqual({
      boardId: 'board-1',
      room: 'board:board-1',
      role: BoardRole.VIEWER,
    });

    expect(client.join).toHaveBeenCalledWith('board:board-1');
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
});
