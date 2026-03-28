import { Controller, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus, ForbiddenException, Req } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { BoardRole } from '../common/enums/board-role.enum';

@Controller('boards')
@UseGuards(JwtAuthGuard, BoardGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post(':boardId/members')
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: AddBoardMemberDto,
  ) {
    if (req.boardRole !== BoardRole.EDITOR) {
      throw new ForbiddenException('Only board editors can manage board members');
    }
    return this.boardsService.addMember(boardId, dto.userId, dto.role);
  }

  @Delete(':boardId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
  ) {
    if (req.boardRole !== BoardRole.EDITOR) {
      throw new ForbiddenException('Only board editors can manage board members');
    }
    await this.boardsService.removeMember(boardId, userId);
  }
}
