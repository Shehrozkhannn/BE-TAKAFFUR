import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateMoodDto } from '../dto/create-mood.dto';
import { Mood } from './mood.entity';

@Injectable()
export class MoodsService {
  private tagSuggestions = [
  { keywords: ["happy", "joy", "grateful"], tag: "gratitude" },
  { keywords: ["sad", "lonely", "hurt"], tag: "patience" },
  { keywords: ["angry", "frustrated"], tag: "calmness" },
  { keywords: ["anxious", "worried"], tag: "trust" },
  { keywords: ["love", "kindness"], tag: "compassion" },
];

  constructor(@InjectRepository(Mood) private repo: Repository<Mood>) {}

  create(dto: CreateMoodDto) {
    const mood = this.repo.create(dto);
    return this.repo.save(mood);
  }

  findRecent(limit = 30) {
    return this.repo.find({
      order: { date: 'DESC', id: 'DESC' },
      take: limit,
    });
  }

  suggestTag(note: string): string {
  const lower = note.toLowerCase();
  for (const group of this.tagSuggestions) {
    if (group.keywords.some(k => lower.includes(k))) {
      return group.tag;
    }
  }
  return "reflection"; // default fallback
}




}
