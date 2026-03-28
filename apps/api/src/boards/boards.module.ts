import { Global, Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardGuard } from '../common/guards/board.guard';

@Global()
@Module({
  providers: [BoardsService, BoardGuard],
  exports: [BoardsService, BoardGuard],
})
export class BoardsModule {}
