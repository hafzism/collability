import { Module } from '@nestjs/common';
import { BoardCardsController } from './board-cards.controller';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CardsController, BoardCardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
