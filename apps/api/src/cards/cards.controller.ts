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
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ReorderCardDto } from './dto/reorder-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { CreateCardCommentDto } from './dto/create-card-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import { RequireBoardRole } from '../common/decorators/require-board-role.decorator';
import { BoardRole } from '../common/enums/board-role.enum';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { BoardEventsService } from '../realtime/board-events.service';

@Controller('boards/:boardId/lists/:listId/cards')
@UseGuards(JwtAuthGuard, BoardGuard)
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly boardEventsService: BoardEventsService,
  ) {}

  @Post()
  @RequireBoardRole(BoardRole.MANAGER, BoardRole.CONTRIBUTOR)
  async createCard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: CreateCardDto,
  ) {
    const card = await this.cardsService.createCard(
      boardId,
      listId,
      req.user.id,
      dto,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'card.created',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      cardId: card.id,
      entity: {
        type: 'card',
        id: card.id,
      },
      listId,
    });

    return card;
  }

  @Get()
  async getCards(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const take = limit ? parseInt(limit) : 50;
    const skip = offset ? parseInt(offset) : 0;
    return this.cardsService.getListCards(boardId, listId, take, skip);
  }

  @Get(':cardId')
  async getCardDetail(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
  ) {
    return this.cardsService.getCardDetail(boardId, listId, cardId);
  }

  @Get(':cardId/activity')
  async getCardActivity(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
  ) {
    return this.cardsService.getCardActivity(boardId, listId, cardId);
  }

  @Post(':cardId/comments')
  @RequireBoardRole(BoardRole.MANAGER, BoardRole.CONTRIBUTOR)
  async createComment(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
    @Body() dto: CreateCardCommentDto,
  ) {
    const comment = await this.cardsService.createComment(
      boardId,
      listId,
      cardId,
      req.user.id,
      dto.content,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'card.comment_created',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      cardId,
      entity: {
        type: 'comment',
        id: comment.id,
      },
      listId,
    });

    return comment;
  }

  @Patch(':cardId')
  @RequireBoardRole(BoardRole.MANAGER, BoardRole.CONTRIBUTOR)
  async updateCard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardDto,
  ) {
    const { dueDate, ...rest } = dto;
    const updateData: any = { ...rest };
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const card = await this.cardsService.updateCard(
      boardId,
      listId,
      cardId,
      req.user.id,
      updateData,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'card.updated',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      cardId,
      entity: {
        type: 'card',
        id: cardId,
      },
      listId,
    });

    return card;
  }

  @Patch(':cardId/reorder')
  @RequireBoardRole(BoardRole.MANAGER, BoardRole.CONTRIBUTOR)
  async reorderCard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
    @Body() dto: ReorderCardDto,
  ) {
    const card = await this.cardsService.reorderCard(
      boardId,
      listId,
      cardId,
      dto.beforeId,
      dto.afterId,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'card.reordered',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      cardId,
      entity: {
        type: 'card',
        id: cardId,
      },
      listId,
    });

    return card;
  }

  @Patch(':cardId/move')
  @RequireBoardRole(BoardRole.MANAGER, BoardRole.CONTRIBUTOR)
  async moveCard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
    @Body() dto: MoveCardDto,
  ) {
    const card = await this.cardsService.moveCard(
      boardId,
      listId,
      cardId,
      dto.targetListId,
      dto.beforeId,
      dto.afterId,
      req.user.id,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'card.moved',
      actorUserId: req.user.id,
      affectedListIds: [listId, dto.targetListId],
      cardId,
      entity: {
        type: 'card',
        id: cardId,
      },
      listId,
      targetListId: dto.targetListId,
    });

    return card;
  }

  @Delete(':cardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.MANAGER)
  async deleteCard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
  ) {
    await this.cardsService.deleteCard(boardId, listId, cardId, req.user.id);

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'card.deleted',
      actorUserId: req.user.id,
      affectedListIds: [listId],
      cardId,
      entity: {
        type: 'card',
        id: cardId,
      },
      listId,
    });
  }
}
