import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardGuard } from '../common/guards/board.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UpdateBoardNotificationSettingDto } from './dto/update-board-notification-setting.dto';
import { NotificationsService } from './notifications.service';

@Controller('boards/:boardId/notifications')
@UseGuards(JwtAuthGuard, BoardGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listBoardNotifications(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listBoardNotifications(
      boardId,
      req.user.id,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Get('unread-count')
  getUnreadBoardNotificationCount(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
  ) {
    return this.notificationsService.getUnreadBoardNotificationCount(
      boardId,
      req.user.id,
    );
  }

  @Get('settings')
  getBoardNotificationSetting(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
  ) {
    return this.notificationsService.getBoardNotificationSetting(
      boardId,
      req.user.id,
    );
  }

  @Patch('settings')
  updateBoardNotificationSetting(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardNotificationSettingDto,
  ) {
    return this.notificationsService.updateBoardNotificationSetting(
      boardId,
      req.user.id,
      dto,
    );
  }

  @Patch('read-all')
  markAllBoardNotificationsRead(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
  ) {
    return this.notificationsService.markAllBoardNotificationsRead(
      boardId,
      req.user.id,
    );
  }

  @Patch(':notificationId/read')
  markBoardNotificationRead(
    @Req() req: AuthenticatedRequest,
    @Param('boardId') boardId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markBoardNotificationRead(
      boardId,
      notificationId,
      req.user.id,
    );
  }
}
