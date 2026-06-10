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
import { BoardEventsService } from '../realtime/board-events.service';

@Controller('boards/:boardId/lists')
@UseGuards(JwtAuthGuard, BoardGuard)
export class ListsController {
  constructor(
    private readonly listsService: ListsService,
    private readonly boardEventsService: BoardEventsService,
  ) {}

  @Post()
  @RequireBoardRole(BoardRole.MANAGER)
  async createList(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
  ) {
    const list = await this.listsService.createList(boardId, req.user.id, dto.title);

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'list.created',
      actorUserId: req.user.id,
      affectedListIds: [list.id],
      entity: {
        type: 'list',
        id: list.id,
      },
      listId: list.id,
    });

    return list;
  }

  @Get()
  async getLists(
    @Param('boardId') boardId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const take = limit ? parseInt(limit) : 50;
    const skip = offset ? parseInt(offset) : 0;
    return this.listsService.getBoardLists(boardId, take, skip);
  }

  @Patch(':listId')
  @RequireBoardRole(BoardRole.MANAGER)
  async updateList(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: UpdateListDto,
  ) {
    const list = await this.listsService.updateList(
      boardId,
      listId,
      req.user.id,
      dto,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'list.updated',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      entity: {
        type: 'list',
        id: listId,
      },
      listId,
    });

    return list;
  }

  @Patch(':listId/reorder')
  @RequireBoardRole(BoardRole.MANAGER)
  async reorderList(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: ReorderListDto,
  ) {
    const list = await this.listsService.reorderList(
      boardId,
      listId,
      dto.beforeId,
      dto.afterId,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'list.reordered',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      entity: {
        type: 'list',
        id: listId,
      },
      listId,
    });

    return list;
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

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'list.deleted',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      entity: {
        type: 'list',
        id: listId,
      },
      listId,
    });
  }
}
