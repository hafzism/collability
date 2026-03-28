import { Global, Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardGuard } from '../common/guards/board.guard';
import { BoardsController } from './boards.controller';

@Global()
@Module({
  controllers: [BoardsController],
  providers: [BoardsService, BoardGuard],
  exports: [BoardsService, BoardGuard],
})
export class BoardsModule {}
