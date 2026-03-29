import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import { RequireBoardRole } from '../common/decorators/require-board-role.decorator';
import { BoardRole } from '../common/enums/board-role.enum';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';

@Controller('boards/:boardId/lists')
@UseGuards(JwtAuthGuard, BoardGuard)
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @RequireBoardRole(BoardRole.EDITOR)
  async createList(
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
  ) {
    return this.listsService.createList(boardId, dto.title, dto.position);
  }

  @Get()
  async getLists(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const include = includeArchived === 'true';
    if (include && req.workspaceRole !== WorkspaceRole.OWNER && req.workspaceRole !== WorkspaceRole.ADMIN) {
       return this.listsService.getBoardLists(boardId, false);
    }
    return this.listsService.getBoardLists(boardId, include);
  }

  @Patch(':listId')
  @RequireBoardRole(BoardRole.EDITOR)
  async updateList(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.listsService.updateList(boardId, listId, dto);
  }

  @Delete(':listId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.EDITOR)
  async deleteList(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
  ) {
    await this.listsService.deleteList(boardId, listId);
  }
}
