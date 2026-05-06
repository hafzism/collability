import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  const prismaService = {
    user: {
      findUnique: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

  const authMailerService = {
    sendWorkspaceInviteEmail: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WorkspacesService(prismaService as any, authMailerService as any);
  });

  it('creates a workspace with a unique slug, join code, and owner membership', async () => {
    prismaService.workspace.findUnique
      .mockResolvedValueOnce({ id: 'workspace-1', slug: 'product-ops' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
        callback(prismaService as any),
    );
    prismaService.workspace.create.mockResolvedValue({
      id: 'workspace-2',
      name: 'Product Ops',
      slug: 'product-ops-2',
      joinCode: 'abc-def-ghi',
      createdBy: 'user-1',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
    });
    prismaService.workspaceMember.create.mockResolvedValue({
      workspaceId: 'workspace-2',
      userId: 'user-1',
      role: WorkspaceRole.OWNER,
    });

    await expect(
      service.createWorkspace('user-1', ' Product   Ops '),
    ).resolves.toEqual({
      id: 'workspace-2',
      name: 'Product Ops',
      slug: 'product-ops-2',
      joinCode: 'abc-def-ghi',
      createdBy: 'user-1',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
      currentUserRole: WorkspaceRole.OWNER,
    });

    expect(prismaService.workspace.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Product Ops',
        slug: 'product-ops-2',
        createdBy: 'user-1',
      }),
    });
    expect(prismaService.workspace.create.mock.calls[0][0].data.joinCode).toMatch(
      /^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/,
    );
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
          joinCode: 'aaa-bbb-ccc',
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
        joinCode: 'aaa-bbb-ccc',
        createdBy: 'user-1',
        createdAt: new Date('2026-04-12T00:00:00.000Z'),
        updatedAt: new Date('2026-04-12T00:00:00.000Z'),
        currentUserRole: WorkspaceRole.ADMIN,
      },
    ]);
  });

  it('sends a workspace invite email with the reusable join code', async () => {
    prismaService.workspace.findUnique.mockResolvedValue({
      id: 'workspace-1',
      name: 'Alpha',
      joinCode: 'abc-def-ghi',
    });

    await expect(
      service.inviteMember('workspace-1', 'John', 'invitee@company.com'),
    ).resolves.toEqual({
      success: true,
      email: 'invitee@company.com',
      joinCode: 'abc-def-ghi',
    });

    expect(authMailerService.sendWorkspaceInviteEmail).toHaveBeenCalledWith({
      email: 'invitee@company.com',
      inviterName: 'John',
      workspaceName: 'Alpha',
      joinCode: 'abc-def-ghi',
    });
  });

  it('joins a workspace as a guest by reusable code', async () => {
    prismaService.workspace.findUnique.mockResolvedValue({
      id: 'workspace-1',
      name: 'Alpha',
      slug: 'alpha',
      joinCode: 'abc-def-ghi',
      createdBy: 'user-9',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
    });
    prismaService.workspaceMember.findUnique.mockResolvedValue(null);
    prismaService.workspaceMember.create.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-2',
      role: WorkspaceRole.GUEST,
      joinedAt: new Date('2026-04-12T02:00:00.000Z'),
    });

    await expect(
      service.joinWorkspaceByCode('user-2', 'abc-def-ghi'),
    ).resolves.toEqual({
      id: 'workspace-1',
      name: 'Alpha',
      slug: 'alpha',
      joinCode: 'abc-def-ghi',
      createdBy: 'user-9',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T00:00:00.000Z'),
      currentUserRole: WorkspaceRole.GUEST,
    });

    expect(prismaService.workspaceMember.create).toHaveBeenCalledWith({
      data: {
        workspaceId: 'workspace-1',
        userId: 'user-2',
        role: WorkspaceRole.GUEST,
      },
    });
  });

  it('updates a member role after they have joined', async () => {
    prismaService.workspaceMember.findUnique.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-2',
      role: WorkspaceRole.GUEST,
    });
    prismaService.workspaceMember.update.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-2',
      role: WorkspaceRole.MEMBER,
    });

    await expect(
      service.updateMemberRole(
        'workspace-1',
        'user-2',
        'user-1',
        WorkspaceRole.MEMBER,
      ),
    ).resolves.toEqual({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-2',
      role: WorkspaceRole.MEMBER,
    });
  });

  it('does not allow members to change their own workspace role', async () => {
    await expect(
      service.updateMemberRole(
        'workspace-1',
        'user-2',
        'user-2',
        WorkspaceRole.MEMBER,
      ),
    ).rejects.toThrow('You cannot change your own workspace role');
  });

  it('allows non-owner members to leave a workspace', async () => {
    prismaService.workspaceMember.findUnique.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-2',
      role: WorkspaceRole.ADMIN,
    });

    await expect(service.leaveWorkspace('workspace-1', 'user-2')).resolves.toBeUndefined();

    expect(prismaService.workspaceMember.delete).toHaveBeenCalledWith({
      where: {
        workspaceId_userId: {
          workspaceId: 'workspace-1',
          userId: 'user-2',
        },
      },
    });
  });

  it('does not allow the owner to leave the workspace', async () => {
    prismaService.workspaceMember.findUnique.mockResolvedValue({
      id: 'membership-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      role: WorkspaceRole.OWNER,
    });

    await expect(
      service.leaveWorkspace('workspace-1', 'user-1'),
    ).rejects.toThrow('Workspace owner cannot leave the workspace');
  });

  it('updates the workspace name without changing the slug', async () => {
    prismaService.workspace.update.mockResolvedValue({
      id: 'workspace-1',
      name: 'New Name',
      slug: 'stable-slug',
      joinCode: 'abc-def-ghi',
      createdBy: 'user-1',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      updatedAt: new Date('2026-04-12T01:00:00.000Z'),
    });

    await expect(
      service.updateWorkspace('workspace-1', { name: ' New   Name ' }),
    ).resolves.toEqual({
      id: 'workspace-1',
      name: 'New Name',
      slug: 'stable-slug',
      joinCode: 'abc-def-ghi',
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
    prismaService.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaService) => Promise<unknown>) =>
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
