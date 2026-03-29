import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import { WorkspaceMember } from '@repo/database';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspaceMembership(userId: string, workspaceId: string): Promise<WorkspaceMember | null> {
    return this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }

  async getWorkspaceRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null> {
    const membership = await this.getWorkspaceMembership(userId, workspaceId);
    return membership ? (membership.role as WorkspaceRole) : null;
  }

  async isWorkspaceMember(userId: string, workspaceId: string): Promise<boolean> {
    const role = await this.getWorkspaceRole(userId, workspaceId);
    return !!role;
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const existing = await this.getWorkspaceMembership(userId, workspaceId);
    if (existing) {
      throw new ConflictException('User is already a member of this workspace');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.getWorkspaceMembership(userId, workspaceId);
    if (!membership) {
      throw new NotFoundException('Workspace member not found');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });
  }
}
