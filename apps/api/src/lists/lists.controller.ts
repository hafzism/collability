import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Query,
} from '@nestjs/common';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ReorderListDto } from './dto/reorder-list.dto';
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
  @RequireBoardRole(BoardRole.MANAGER)
  async createList(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
  ) {
    return this.listsService.createList(boardId, req.user.id, dto.title);
  }

  @Get()
  async getLists(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const include = includeArchived === 'true';
    const take = limit ? parseInt(limit) : 50;
    const skip = offset ? parseInt(offset) : 0;
    if (
      include &&
      req.workspaceRole !== WorkspaceRole.OWNER &&
      req.workspaceRole !== WorkspaceRole.ADMIN
    ) {
      return this.listsService.getBoardLists(boardId, false, take, skip);
    }
    return this.listsService.getBoardLists(boardId, include, take, skip);
  }

  @Patch(':listId')
  @RequireBoardRole(BoardRole.MANAGER)
  async updateList(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: UpdateListDto,
  ) {
    return this.listsService.updateList(boardId, listId, req.user.id, dto);
  }

  @Patch(':listId/reorder')
  @RequireBoardRole(BoardRole.MANAGER)
  async reorderList(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: ReorderListDto,
  ) {
    return this.listsService.reorderList(
      boardId,
      listId,
      dto.beforeId,
      dto.afterId,
    );
  }

  @Delete(':listId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.MANAGER)
  async deleteList(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
  ) {
    await this.listsService.deleteList(boardId, listId, req.user.id);
  }
}
