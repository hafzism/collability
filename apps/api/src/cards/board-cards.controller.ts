import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import { CardsService } from './cards.service';
import { SearchBoardCardsDto } from './dto/search-board-cards.dto';

@Controller('boards/:boardId/cards')
@UseGuards(JwtAuthGuard, BoardGuard)
export class BoardCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get('search')
  async searchBoardCards(
    @Param('boardId') boardId: string,
    @Query() query: SearchBoardCardsDto,
  ) {
    return this.cardsService.searchBoardCards(boardId, {
      query: query.q,
      assigneeIds: query.assigneeIds,
      labelIds: query.labelIds,
      creatorIds: query.creatorIds,
      listIds: query.listIds,
      dueFrom: query.dueFrom ? new Date(query.dueFrom) : undefined,
      dueTo: query.dueTo ? new Date(query.dueTo) : undefined,
      dueState: query.dueState,
      unassigned: query.unassigned,
      withoutDueDate: query.withoutDueDate,
    });
  }
}
