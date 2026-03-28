import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { BoardRole } from '../common/enums/board-role.enum';
import { RequireBoardRole } from '../common/decorators/require-board-role.decorator';

@Controller('boards')
@UseGuards(JwtAuthGuard, BoardGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get(':boardId')
  async getBoard(@Param('boardId') boardId: string) {
    return this.boardsService.getBoardById(boardId);
  }

  @Patch(':boardId')
  @RequireBoardRole(BoardRole.EDITOR)
  async updateBoard(
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.updateBoard(boardId, dto);
  }

  @Delete(':boardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.EDITOR)
  async deleteBoard(@Param('boardId') boardId: string) {
    await this.boardsService.deleteBoard(boardId);
  }

  @Post(':boardId/members')
  @RequireBoardRole(BoardRole.EDITOR)
  async addMember(
    @Param('boardId') boardId: string,
    @Body() dto: AddBoardMemberDto,
  ) {
    return this.boardsService.addMember(boardId, dto.userId, dto.role);
  }

  @Delete(':boardId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.EDITOR)
  async removeMember(
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
  ) {
    await this.boardsService.removeMember(boardId, userId);
  }
}
