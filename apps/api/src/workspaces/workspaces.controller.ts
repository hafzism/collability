import { Controller, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post(':workspaceId/members')
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(workspaceId, dto.userId, dto.role);
  }

  @Delete(':workspaceId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
  ) {
    await this.workspacesService.removeMember(workspaceId, userId);
  }
}
