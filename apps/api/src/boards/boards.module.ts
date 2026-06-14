import { Global, Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardGuard } from '../common/guards/board.guard';
import { BoardsController } from './boards.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Global()
@Module({
  imports: [NotificationsModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardGuard],
  exports: [BoardsService, BoardGuard],
})
export class BoardsModule {}
