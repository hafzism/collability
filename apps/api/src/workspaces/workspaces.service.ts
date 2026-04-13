import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceMember } from '@repo/database';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';

const MIN_WORKSPACE_NAME_LENGTH = 2;
const MAX_WORKSPACE_NAME_LENGTH = 48;

const sanitize = (value: string) =>
  sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });

type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  currentUserRole: WorkspaceRole;
};

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(userId: string, name: string): Promise<WorkspaceSummary> {
    const normalizedName = this.normalizeAndValidateName(name);

    return this.prisma.$transaction(async (tx) => {
      const slug = await this.generateUniqueSlug(normalizedName);
      const workspace = await tx.workspace.create({
        data: {
          name: normalizedName,
          slug,
          createdBy: userId,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      return {
        ...workspace,
        currentUserRole: WorkspaceRole.OWNER,
      };
    });
  }

  async listUserWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      orderBy: {
        workspace: {
          createdAt: 'asc',
        },
      },
      include: {
        workspace: true,
      },
    });

    return memberships.map(({ role, workspace }) => ({
      ...workspace,
      currentUserRole: role as WorkspaceRole,
    }));
  }

  async getWorkspaceById(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          orderBy: {
            joinedAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

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

  async updateWorkspace(workspaceId: string, data: { name?: string }) {
    const updateData: { name?: string } = {};

    if (data.name !== undefined) {
      updateData.name = this.normalizeAndValidateName(data.name);
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (existing) {
        throw new ConflictException('User is already a member of this workspace');
      }

      return tx.workspaceMember.create({
        data: {
          workspaceId,
          userId,
          role,
        },
      });
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

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.activityLog.deleteMany({
        where: { workspaceId },
      });
      await tx.boardMember.deleteMany({
        where: {
          board: {
            workspaceId,
          },
        },
      });
      await tx.cardAssignee.deleteMany({
        where: {
          card: {
            list: {
              board: {
                workspaceId,
              },
            },
          },
        },
      });
      await tx.cardLabel.deleteMany({
        where: {
          card: {
            list: {
              board: {
                workspaceId,
              },
            },
          },
        },
      });
      await tx.comment.deleteMany({
        where: {
          card: {
            list: {
              board: {
                workspaceId,
              },
            },
          },
        },
      });
      await tx.card.deleteMany({
        where: {
          list: {
            board: {
              workspaceId,
            },
          },
        },
      });
      await tx.label.deleteMany({
        where: {
          board: {
            workspaceId,
          },
        },
      });
      await tx.list.deleteMany({
        where: {
          board: {
            workspaceId,
          },
        },
      });
      await tx.board.deleteMany({
        where: {
          workspaceId,
        },
      });
      await tx.workspaceMember.deleteMany({
        where: { workspaceId },
      });
      await tx.workspace.delete({
        where: { id: workspaceId },
      });
    });
  }

  private normalizeAndValidateName(value: string): string {
    const normalizedValue = sanitize(value).trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
      throw new BadRequestException('Workspace name is required');
    }

    if (normalizedValue.length < MIN_WORKSPACE_NAME_LENGTH) {
      throw new BadRequestException('Workspace name must be at least 2 characters');
    }

    if (normalizedValue.length > MAX_WORKSPACE_NAME_LENGTH) {
      throw new BadRequestException('Workspace name must be 48 characters or less');
    }

    return normalizedValue;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = this.slugify(name);

    if (!baseSlug) {
      throw new BadRequestException('Workspace slug could not be generated');
    }

    let candidate = baseSlug;
    let suffix = 2;

    while (await this.prisma.workspace.findUnique({ where: { slug: candidate } })) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
