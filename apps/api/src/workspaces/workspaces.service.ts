import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceMember } from '@repo/database';
import sanitizeHtml from 'sanitize-html';
import { AuthMailerService } from '../auth/auth-mailer.service';
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
  joinCode: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  currentUserRole: WorkspaceRole;
};

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authMailerService: AuthMailerService,
  ) {}

  async createWorkspace(userId: string, name: string): Promise<WorkspaceSummary> {
    const normalizedName = this.normalizeAndValidateName(name);

    return this.prisma.$transaction(async (tx) => {
      const slug = await this.generateUniqueSlug(normalizedName);
      const joinCode = await this.generateUniqueJoinCode();
      const workspace = await tx.workspace.create({
        data: {
          name: normalizedName,
          slug,
          joinCode,
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

  async inviteMember(workspaceId: string, inviterName: string, email: string) {
    const normalizedEmail = this.normalizeAndValidateEmail(email);
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        joinCode: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.authMailerService.sendWorkspaceInviteEmail({
      email: normalizedEmail,
      inviterName: sanitize(inviterName).trim() || 'Someone',
      workspaceName: workspace.name,
      joinCode: workspace.joinCode,
    });

    return {
      success: true,
      email: normalizedEmail,
      joinCode: workspace.joinCode,
    };
  }

  async joinWorkspaceByCode(userId: string, code: string): Promise<WorkspaceSummary> {
    const normalizedCode = this.normalizeJoinCode(code);
    const workspace = await this.prisma.workspace.findUnique({
      where: { joinCode: normalizedCode },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace invite code is invalid');
    }

    const existingMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId,
        },
      },
    });

    if (existingMembership) {
      throw new ConflictException('You are already a member of this workspace');
    }

    await this.prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: WorkspaceRole.GUEST,
      },
    });

    return {
      ...workspace,
      currentUserRole: WorkspaceRole.GUEST,
    };
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

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    actorUserId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember> {
    if (userId === actorUserId) {
      throw new ForbiddenException('You cannot change your own workspace role');
    }

    if (role === WorkspaceRole.OWNER) {
      throw new BadRequestException('Workspace owner role cannot be assigned here');
    }

    const existing = await this.getWorkspaceMembership(userId, workspaceId);
    if (!existing) {
      throw new NotFoundException('Workspace member not found');
    }

    if (existing.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot change the workspace owner role');
    }

    return this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      data: {
        role,
      },
    });
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const membership = await this.getWorkspaceMembership(userId, workspaceId);
    if (!membership) {
      throw new NotFoundException('Workspace member not found');
    }

    if (membership.role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Workspace owner cannot leave the workspace');
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

  private normalizeAndValidateEmail(value: string): string {
    const normalizedValue = sanitize(value).trim().toLowerCase();

    if (!normalizedValue) {
      throw new BadRequestException('Email is required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
      throw new BadRequestException('A valid email is required');
    }

    return normalizedValue;
  }

  private normalizeJoinCode(value: string): string {
    const compactValue = sanitize(value)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    if (compactValue.length !== 9) {
      throw new BadRequestException('Workspace invite code must be 9 characters');
    }

    return `${compactValue.slice(0, 3)}-${compactValue.slice(3, 6)}-${compactValue.slice(6, 9)}`;
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

  private async generateUniqueJoinCode(): Promise<string> {
    let candidate = '';

    do {
      candidate = this.formatJoinCode(
        Array.from({ length: 9 }, () =>
          'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(
            Math.floor(Math.random() * 36),
          ),
        ).join(''),
      );
    } while (await this.prisma.workspace.findUnique({ where: { joinCode: candidate } }));

    return candidate;
  }

  private formatJoinCode(value: string): string {
    return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 9)}`;
  }
}
