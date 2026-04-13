import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { BoardsService } from '../boards/boards.service';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  const workspacesService = {
    createWorkspace: jest.fn(),
    listUserWorkspaces: jest.fn(),
    getWorkspaceById: jest.fn(),
    updateWorkspace: jest.fn(),
    deleteWorkspace: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  };

  const boardsService = {
    createBoard: jest.fn(),
    findWorkspaceBoards: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WorkspacesService,
          useValue: workspacesService,
        },
        {
          provide: BoardsService,
          useValue: boardsService,
        },
      ],
    }).compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
  });

  it('creates a workspace for the authenticated user', async () => {
    workspacesService.createWorkspace.mockResolvedValue({ id: 'workspace-1' });

    await expect(
      controller.createWorkspace(
        { user: { id: 'user-1' } } as any,
        { name: 'Product Ops' },
      ),
    ).resolves.toEqual({ id: 'workspace-1' });

    expect(workspacesService.createWorkspace).toHaveBeenCalledWith(
      'user-1',
      'Product Ops',
    );
  });

  it('lists workspaces for the authenticated user', async () => {
    workspacesService.listUserWorkspaces.mockResolvedValue([{ id: 'workspace-1' }]);

    await expect(controller.listWorkspaces({ user: { id: 'user-1' } } as any)).resolves.toEqual([
      { id: 'workspace-1' },
    ]);

    expect(workspacesService.listUserWorkspaces).toHaveBeenCalledWith('user-1');
  });

  it('gets workspace details for the requested workspace', async () => {
    workspacesService.getWorkspaceById.mockResolvedValue({ id: 'workspace-1' });

    await expect(
      controller.getWorkspace({ workspaceRole: WorkspaceRole.ADMIN } as any, 'workspace-1'),
    ).resolves.toEqual({
      id: 'workspace-1',
      currentUserRole: WorkspaceRole.ADMIN,
    });
  });

  it('updates a workspace by id', async () => {
    workspacesService.updateWorkspace.mockResolvedValue({ id: 'workspace-1' });

    await expect(
      controller.updateWorkspace('workspace-1', { name: 'Updated' }),
    ).resolves.toEqual({ id: 'workspace-1' });

    expect(workspacesService.updateWorkspace).toHaveBeenCalledWith('workspace-1', {
      name: 'Updated',
    });
  });

  it('deletes a workspace by id', async () => {
    workspacesService.deleteWorkspace.mockResolvedValue(undefined);

    await expect(controller.deleteWorkspace('workspace-1')).resolves.toBeUndefined();
    expect(workspacesService.deleteWorkspace).toHaveBeenCalledWith('workspace-1');
  });
});
