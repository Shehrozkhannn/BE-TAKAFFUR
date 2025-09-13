import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mood } from './mood.entity';
import { MoodsController } from './mood.controller';
import { MoodsService } from './mood.service';
import { QuoteService } from '../quote/quote.service';


@Module({
  imports: [TypeOrmModule.forFeature([Mood])],
  controllers: [MoodsController],
  providers: [MoodsService, QuoteService],
})
export class MoodsModule {}