import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  const prismaService = {
    workspace: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    activityLog: {
      deleteMany: jest.fn(),
    },
    boardMember: {
      deleteMany: jest.fn(),
    },
    cardAssignee: {
      deleteMany: jest.fn(),
    },
    cardLabel: {
      deleteMany: jest.fn(),
    },
    comment: {
      deleteMany: jest.fn(),
    },
    card: {
      deleteMany: jest.fn(),
    },
    label: {
      deleteMany: jest.fn(),
    },
    list: {
      deleteMany: jest.fn(),
    },
    board: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WorkspacesService(prismaService as any);
  });

  it('creates a workspace with a unique slug and owner membership', async () => {
    prismaService.workspace.findUnique
      .mockResolvedValueOnce({ id: 'workspace-1', slug: 'product-ops' })
      .mockResolvedValueOnce(null);
    prismaService.$transaction.mockImplementation(async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
      callback(prismaService as any),
    );
    prismaService.workspace.create = jest.fn().mockResolvedValue({
      id: 'workspace-2',
      name: 'Product Ops',
      slug: 'product-ops-2',
      createdBy: 'user-1',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
    });
    prismaService.workspaceMember.create.mockResolvedValue({
      workspaceId: 'workspace-2',
      userId: 'user-1',
      role: WorkspaceRole.OWNER,
    });

    await expect(service.createWorkspace('user-1', ' Product   Ops ')).resolves.toEqual({
      id: 'workspace-2',
      name: 'Product Ops',
      slug: 'product-ops-2',
      createdBy: 'user-1',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
      currentUserRole: WorkspaceRole.OWNER,
    });

    expect(prismaService.workspace.create).toHaveBeenCalledWith({
      data: {
        name: 'Product Ops',
        slug: 'product-ops-2',
        createdBy: 'user-1',
      },
    });
    expect(prismaService.workspaceMember.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'workspace-2',
        userId: 'user-1',
        role: WorkspaceRole.OWNER,
      },
    });
  });

  it('lists workspaces for the current user with their role', async () => {
    prismaService.workspaceMember.findMany.mockResolvedValue([
      {
        role: WorkspaceRole.ADMIN,
        workspace: {
          id: 'workspace-1',
          name: 'Alpha',
          slug: 'alpha',
          createdBy: 'user-1',
          createdAt: new Date('2026-04-12T00:00:00.000Z'),
          updatedAt: new Date('2026-04-12T00:00:00.000Z'),
        },
      },
    ]);

    await expect(service.listUserWorkspaces('user-2')).resolves.toEqual([
      {
        id: 'workspace-1',
        name: 'Alpha',
        slug: 'alpha',
        createdBy: 'user-1',
        createdAt: new Date('2026-04-12T00:00:00.000Z'),
        updatedAt: new Date('2026-04-12T00:00:00.000Z'),
        currentUserRole: WorkspaceRole.ADMIN,
      },
    ]);
  });

  it('updates the workspace name without changing the slug', async () => {
    prismaService.workspace.update.mockResolvedValue({
      id: 'workspace-1',
      name: 'New Name',
      slug: 'stable-slug',
      createdBy: 'user-1',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T01:00:00.000Z'),
    });

    await expect(service.updateWorkspace('workspace-1', { name: ' New   Name ' })).resolves.toEqual({
      id: 'workspace-1',
      name: 'New Name',
      slug: 'stable-slug',
      createdBy: 'user-1',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T01:00:00.000Z'),
    });

    expect(prismaService.workspace.update).toHaveBeenCalledWith({
      where: { id: 'workspace-1' },
      data: { name: 'New Name' },
    });
  });

  it('deletes workspace-owned records before deleting the workspace', async () => {
    prismaService.$transaction.mockImplementation(async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
      callback(prismaService as any),
    );
    prismaService.workspace.delete.mockResolvedValue({ id: 'workspace-1' });

    await service.deleteWorkspace('workspace-1');

    expect(prismaService.activityLog.deleteMany).toHaveBeenCalled();
    expect(prismaService.workspaceMember.deleteMany).toHaveBeenCalled();
    expect(prismaService.board.deleteMany).toHaveBeenCalled();
    expect(prismaService.workspace.delete).toHaveBeenCalledWith({
      where: { id: 'workspace-1' },
    });
  });
});
