import { Module } from '@nestjs/common';
import { BoardCardsController } from './board-cards.controller';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';

@Module({
  controllers: [CardsController, BoardCardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
