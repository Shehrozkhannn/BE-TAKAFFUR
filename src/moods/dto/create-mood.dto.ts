import { IsString, Length, IsDateString } from 'class-validator';

export class CreateMoodDto {

  @IsString()
  note: string;

  // YYYY-MM-DD
  @IsDateString()
  date: string;
}