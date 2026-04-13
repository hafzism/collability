import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { BoardsService } from '../boards/boards.service';
import { CreateBoardDto } from '../boards/dto/create-board.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly boardsService: BoardsService,
  ) {}

  @Post()
  async createWorkspace(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createWorkspace(req.user.id, dto.name);
  }

  @Get()
  async listWorkspaces(@Req() req: AuthenticatedRequest) {
    return this.workspacesService.listUserWorkspaces(req.user.id);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceGuard)
  async getWorkspace(
    @Req() req: AuthenticatedRequest,
    @Param('workspaceId') workspaceId: string,
  ) {
    const workspace = await this.workspacesService.getWorkspaceById(workspaceId);
    return {
      ...workspace,
      currentUserRole: req.workspaceRole,
    };
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateWorkspace(workspaceId, dto);
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER)
  async deleteWorkspace(@Param('workspaceId') workspaceId: string) {
    await this.workspacesService.deleteWorkspace(workspaceId);
  }

  @Post(':workspaceId/members')
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    return this.workspacesService.addMember(workspaceId, dto.userId, dto.role);
  }

  @Delete(':workspaceId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(WorkspaceGuard, RolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
  ) {
    await this.workspacesService.removeMember(workspaceId, userId);
  }

  @Post(':workspaceId/boards')
  @UseGuards(WorkspaceGuard, RolesGuard)
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
      dto.visibility,
    );
  }

  @Get(':workspaceId/boards')
  @UseGuards(WorkspaceGuard)
  async getBoards(
    @Req() req: AuthenticatedRequest,
    @Param('workspaceId') workspaceId: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const include = includeArchived === 'true';
    const take = limit ? parseInt(limit, 10) : 50;
    const skip = offset ? parseInt(offset, 10) : 0;

    if (
      include &&
      req.workspaceRole !== WorkspaceRole.OWNER &&
      req.workspaceRole !== WorkspaceRole.ADMIN
    ) {
      return this.boardsService.findWorkspaceBoards(
        workspaceId,
        req.user.id,
        false,
        take,
        skip,
      );
    }

    return this.boardsService.findWorkspaceBoards(
      workspaceId,
      req.user.id,
      include,
      take,
      skip,
    );
  }
}
