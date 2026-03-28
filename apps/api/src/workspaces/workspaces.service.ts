import { Injectable } from '@nestjs/common';
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
}
