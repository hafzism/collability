import { Controller, Post, Get, Delete, Param, Body, UseGuards, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { BoardsService } from '../boards/boards.service';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateBoardDto } from '../boards/dto/create-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('workspaces')
@UseGuards(JwtAuthGuard, WorkspaceGuard, RolesGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly boardsService: BoardsService,
  ) {}

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

  @Post(':workspaceId/boards')
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER)
  async createBoard(
    @Req() req: AuthenticatedRequest,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardsService.createBoard(
      workspaceId,
      req.user.id,
      dto.title,
      dto.description,
      dto.visibility
    );
  }

  @Get(':workspaceId/boards')
  async getBoards(
    @Req() req: AuthenticatedRequest,
    @Param('workspaceId') workspaceId: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const include = includeArchived === 'true';
    const take = limit ? parseInt(limit) : 50;
    const skip = offset ? parseInt(offset) : 0;
    if (include && req.workspaceRole !== WorkspaceRole.OWNER && req.workspaceRole !== WorkspaceRole.ADMIN) {
      return this.boardsService.findWorkspaceBoards(workspaceId, req.user.id, false, take, skip);
    }

    return this.boardsService.findWorkspaceBoards(workspaceId, req.user.id, include, take, skip);
  }
}
