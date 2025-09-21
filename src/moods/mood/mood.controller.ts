import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CreateMoodDto } from '../dto/create-mood.dto';
import { QuoteService } from '../quote/quote.service';
import { MoodsService } from './mood.service';

@Controller('moods')
export class MoodsController {
  constructor(private moods: MoodsService, private quotes: QuoteService) {}

  @Post()
  async create(@Body() dto: CreateMoodDto) {
    const saved = await this.moods.create(dto);
    const quote = await this.quotes.getAdvice(dto.note);
    const suggestedTag = await this.moods.suggestTag(dto.note);
    return { saved, quote,  suggestedTag};
  }
}
