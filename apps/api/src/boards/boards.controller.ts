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
import { CreateBoardLabelDto } from './dto/create-board-label.dto';
import { BoardEventsService } from '../realtime/board-events.service';

@Controller('boards')
@UseGuards(JwtAuthGuard, BoardGuard)
export class BoardsController {
  constructor(
    private readonly boardsService: BoardsService,
    private readonly boardEventsService: BoardEventsService,
  ) {}

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

  @Post(':boardId/labels')
  @RequireBoardRole(BoardRole.MANAGER, BoardRole.CONTRIBUTOR)
  async createBoardLabel(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: CreateBoardLabelDto,
  ) {
    const label = await this.boardsService.createBoardLabel(
      boardId,
      req.user.id,
      dto.name,
      dto.color,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'board.label_created',
      actorUserId: req.user.id,
      entity: {
        type: 'label',
        id: label.id,
      },
    });

    return label;
  }

  @Patch(':boardId')
  @RequireBoardRole(BoardRole.MANAGER)
  async updateBoard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    const board = await this.boardsService.updateBoard(boardId, req.user.id, dto);

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'board.updated',
      actorUserId: req.user.id,
      entity: {
        type: 'board',
        id: boardId,
      },
      workspaceId: board.workspaceId,
    });

    return board;
  }

  @Delete(':boardId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireBoardRole(BoardRole.MANAGER)
  async deleteBoard(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
  ) {
    const board = await this.boardsService.deleteBoard(boardId, req.user.id);

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'board.deleted',
      actorUserId: req.user.id,
      entity: {
        type: 'board',
        id: boardId,
      },
      workspaceId: board.workspaceId,
    });
  }

  @Post(':boardId/members')
  @RequireBoardRole(BoardRole.MANAGER)
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: AddBoardMemberDto,
  ) {
    const member = await this.boardsService.addMember(
      boardId,
      dto.userId,
      dto.role,
      req.user.id,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'board.member_added',
      actorUserId: req.user.id,
      entity: {
        type: 'member',
        id: dto.userId,
      },
    });

    return member;
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

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'board.member_removed',
      actorUserId: req.user.id,
      entity: {
        type: 'member',
        id: userId,
      },
    });
  }

  @Patch(':boardId/members/:userId')
  @RequireBoardRole(BoardRole.MANAGER)
  async updateMemberRole(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateBoardMemberRoleDto,
  ) {
    const member = await this.boardsService.updateMemberRole(
      boardId,
      userId,
      req.user.id,
      dto.role,
    );

    this.boardEventsService.emitBoardEvent({
      boardId,
      type: 'board.member_role_changed',
      actorUserId: req.user.id,
      entity: {
        type: 'member',
        id: userId,
      },
    });

    return member;
  }
}
