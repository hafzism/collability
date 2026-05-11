import { ForbiddenException } from '@nestjs/common';
import { BoardRole } from '../common/enums/board-role.enum';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import { BoardsService } from './boards.service';

describe('BoardsService', () => {
  let service: BoardsService;

  const prismaService = {
    board: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    boardMember: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
        callback(prismaService as any),
    );
    prismaService.activityLog.create.mockResolvedValue(undefined);
    service = new BoardsService(prismaService as any);
  });

  it('creates the board creator as a manager', async () => {
    prismaService.board.create.mockResolvedValue({ id: 'board-1' });

    await expect(
      service.createBoard('workspace-1', 'user-1', 'Roadmap'),
    ).resolves.toEqual({ id: 'board-1' });

    expect(prismaService.board.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: 'workspace-1',
        createdBy: 'user-1',
        title: 'Roadmap',
        members: {
          create: {
            userId: 'user-1',
            role: BoardRole.MANAGER,
          },
        },
      }),
    });
  });

  it('does not allow removing the board creator from membership', async () => {
    prismaService.board.findUnique.mockResolvedValue({
      id: 'board-1',
      createdBy: 'user-1',
    });

    await expect(service.removeMember('board-1', 'user-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('lists private boards for workspace admins and owners', async () => {
    prismaService.board.findMany.mockResolvedValue([{ id: 'private-board' }]);

    await expect(
      service.findWorkspaceBoards(
        'workspace-1',
        'admin-1',
        WorkspaceRole.ADMIN,
      ),
    ).resolves.toEqual([{ id: 'private-board' }]);

    expect(prismaService.board.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workspaceId: 'workspace-1',
          archived: false,
        },
      }),
    );
  });

  it('limits regular members to workspace-visible or explicitly joined boards', async () => {
    prismaService.board.findMany.mockResolvedValue([{ id: 'visible-board' }]);

    await service.findWorkspaceBoards(
      'workspace-1',
      'user-1',
      WorkspaceRole.MEMBER,
    );

    expect(prismaService.board.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          workspaceId: 'workspace-1',
          archived: false,
          OR: [
            { visibility: 'WORKSPACE' },
            { members: { some: { userId: 'user-1' } } },
            { createdBy: 'user-1' },
          ],
        },
      }),
    );
  });

  it('updates explicit board member roles', async () => {
    prismaService.board.findUnique.mockResolvedValue({
      id: 'board-1',
      workspaceId: 'workspace-1',
      createdBy: 'user-1',
    });
    prismaService.boardMember.findUnique.mockResolvedValue({
      boardId: 'board-1',
      userId: 'user-2',
      role: BoardRole.VIEWER,
    });
    prismaService.boardMember.update.mockResolvedValue({
      boardId: 'board-1',
      userId: 'user-2',
      role: BoardRole.CONTRIBUTOR,
    });

    await expect(
      service.updateMemberRole(
        'board-1',
        'user-2',
        'user-1',
        BoardRole.CONTRIBUTOR,
      ),
    ).resolves.toEqual({
      boardId: 'board-1',
      userId: 'user-2',
      role: BoardRole.CONTRIBUTOR,
    });
  });

  it('lists board activity items', async () => {
    prismaService.board.findUnique.mockResolvedValue({
      id: 'board-1',
      workspaceId: 'workspace-1',
    });
    prismaService.activityLog.findMany.mockResolvedValue([
      {
        id: 'log-1',
        action: 'board.created',
        metadata: {},
        createdAt: new Date('2026-05-09T10:00:00.000Z'),
        user: {
          id: 'user-1',
          name: 'Hafeez',
        },
      },
    ]);

    await expect(service.getBoardActivity('board-1')).resolves.toEqual([
      {
        id: 'log-1',
        label: 'Hafeez created the board',
        timestamp: new Date('2026-05-09T10:00:00.000Z'),
      },
    ]);
  });
});
