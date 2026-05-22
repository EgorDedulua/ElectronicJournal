import {
    Column,
    Entity,
    PrimaryGeneratedColumn
} from 'typeorm';

@Entity('lessons_timings')
export class LessonTimings {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ unique: true })
    lessonNumber!: number;

    @Column({ type:'time without time zone', unique: true })
    startTime!: string;

    @Column({ type: 'time without time zone', unique: true })
    endTime!: string;
}