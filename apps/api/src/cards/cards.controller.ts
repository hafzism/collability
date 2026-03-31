import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus, Req, Query } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ReorderCardDto } from './dto/reorder-card.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import { RequireBoardRole } from '../common/decorators/require-board-role.decorator';
import { BoardRole } from '../common/enums/board-role.enum';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { WorkspaceRole } from '../common/enums/workspace-role.enum';

@Controller('boards/:boardId/lists/:listId/cards')
@UseGuards(JwtAuthGuard, BoardGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post()
  @RequireBoardRole(BoardRole.EDITOR)
  async createCard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.createCard(boardId, listId, req.user.id, {
      ...dto,
    });
  }

  @Get()
  async getCards(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const include = includeArchived === 'true';
    const take = limit ? parseInt(limit) : 50;
    const skip = offset ? parseInt(offset) : 0;
    if (include && req.workspaceRole !== WorkspaceRole.OWNER && req.workspaceRole !== WorkspaceRole.ADMIN) {
       return this.cardsService.getListCards(boardId, listId, false, take, skip);
    }
    return this.cardsService.getListCards(boardId, listId, include, take, skip);
  }

  @Patch(':cardId')
  @RequireBoardRole(BoardRole.EDITOR)
  async updateCard(
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
    
    return this.cardsService.updateCard(boardId, listId, cardId, updateData);
  }

  @Patch(':cardId/reorder')
  @RequireBoardRole(BoardRole.EDITOR)
  async reorderCard(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
    @Body() dto: ReorderCardDto,
  ) {
    return this.cardsService.reorderCard(boardId, listId, cardId, dto.beforeId, dto.afterId);
  }

  @Patch(':cardId/move')
  @RequireBoardRole(BoardRole.EDITOR)
  async moveCard(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.cardsService.moveCard(boardId, listId, cardId, dto.targetListId, dto.beforeId, dto.afterId);
  }

  @Delete(':cardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.EDITOR)
  async deleteCard(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('cardId') cardId: string,
  ) {
    await this.cardsService.deleteCard(boardId, listId, cardId);
  }
}
