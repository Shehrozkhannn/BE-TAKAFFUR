import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Mood {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  note: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @CreateDateColumn()
  createdAt: Date;
}
