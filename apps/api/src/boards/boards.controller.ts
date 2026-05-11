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
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import { BoardRole } from '../common/enums/board-role.enum';
import { RequireBoardRole } from '../common/decorators/require-board-role.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UpdateBoardMemberRoleDto } from './dto/update-board-member-role.dto';

@Controller('boards')
@UseGuards(JwtAuthGuard, BoardGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get(':boardId')
  async getBoard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
  ) {
    const board = await this.boardsService.getBoardDetail(boardId);

    return board
      ? {
          ...board,
          currentUserBoardRole: req.boardRole,
        }
      : null;
  }

  @Get(':boardId/activity')
  async getBoardActivity(@Param('boardId') boardId: string) {
    return this.boardsService.getBoardActivity(boardId);
  }

  @Patch(':boardId')
  @RequireBoardRole(BoardRole.MANAGER)
  async updateBoard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.updateBoard(boardId, req.user.id, dto);
  }

  @Delete(':boardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.MANAGER)
  async deleteBoard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
  ) {
    await this.boardsService.deleteBoard(boardId, req.user.id);
  }

  @Post(':boardId/members')
  @RequireBoardRole(BoardRole.MANAGER)
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: AddBoardMemberDto,
  ) {
    return this.boardsService.addMember(
      boardId,
      dto.userId,
      dto.role,
      req.user.id,
    );
  }

  @Delete(':boardId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.MANAGER)
  async removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
  ) {
    await this.boardsService.removeMember(boardId, userId, req.user.id);
  }

  @Patch(':boardId/members/:userId')
  @RequireBoardRole(BoardRole.MANAGER)
  async updateMemberRole(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateBoardMemberRoleDto,
  ) {
    return this.boardsService.updateMemberRole(
      boardId,
      userId,
      req.user.id,
      dto.role,
    );
  }
}
