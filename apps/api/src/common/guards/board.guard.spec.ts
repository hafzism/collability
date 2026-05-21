import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { BoardGuard } from './board.guard';
import { BoardRole } from '../enums/board-role.enum';
import { WorkspaceRole } from '../enums/workspace-role.enum';
import { REQUIRE_BOARD_ROLE_KEY } from '../decorators/require-board-role.decorator';

describe('BoardGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const boardsService = {
    getBoardById: jest.fn(),
    getBoardMembership: jest.fn(),
  };
  const workspacesService = {
    getWorkspaceRole: jest.fn(),
  };

  const makeContext = (request: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    }) as any;

  let guard: BoardGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new BoardGuard(
      reflector as unknown as Reflector,
      boardsService as any,
      workspacesService as any,
    );
    reflector.getAllAndOverride.mockReturnValue(undefined);
    boardsService.getBoardById.mockResolvedValue({
      id: 'board-1',
      workspaceId: 'workspace-1',
      visibility: 'WORKSPACE',
      createdBy: 'creator-1',
      archived: false,
    });
    boardsService.getBoardMembership.mockResolvedValue(null);
    workspacesService.getWorkspaceRole.mockResolvedValue(WorkspaceRole.MEMBER);
  });

  it('gives workspace-visible boards viewer access when the user is not an explicit board member', async () => {
    const request = { user: { id: 'user-1' }, params: { boardId: 'board-1' } };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    expect(request.boardRole).toBe(BoardRole.VIEWER);
  });

  it('allows workspace admins to view private boards without manager privileges', async () => {
    boardsService.getBoardById.mockResolvedValue({
      id: 'board-1',
      workspaceId: 'workspace-1',
      visibility: 'PRIVATE',
      createdBy: 'creator-1',
      archived: false,
    });
    workspacesService.getWorkspaceRole.mockResolvedValue(WorkspaceRole.ADMIN);
    const request = { user: { id: 'admin-1' }, params: { boardId: 'board-1' } };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    expect(request.boardRole).toBe(BoardRole.VIEWER);
  });

  it('treats the board creator as manager even if membership data is missing', async () => {
    const request = {
      user: { id: 'creator-1' },
      params: { boardId: 'board-1' },
    };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);

    expect(request.boardRole).toBe(BoardRole.MANAGER);
  });

  it('allows contributors to perform contributor-level actions', async () => {
    boardsService.getBoardMembership.mockResolvedValue({
      role: BoardRole.CONTRIBUTOR,
    });
    reflector.getAllAndOverride.mockImplementation((key: string) =>
      key === REQUIRE_BOARD_ROLE_KEY
        ? [BoardRole.MANAGER, BoardRole.CONTRIBUTOR]
        : undefined,
    );
    const request = { user: { id: 'user-1' }, params: { boardId: 'board-1' } };

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
  });

  it('does not allow contributors to perform manager-only actions', async () => {
    boardsService.getBoardMembership.mockResolvedValue({
      role: BoardRole.CONTRIBUTOR,
    });
    reflector.getAllAndOverride.mockReturnValue([BoardRole.MANAGER]);

    await expect(
      guard.canActivate(
        makeContext({ user: { id: 'user-1' }, params: { boardId: 'board-1' } }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
