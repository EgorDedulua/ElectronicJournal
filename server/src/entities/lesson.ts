import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Timetable } from './timetable';

export enum LessonType {
    USUAL = 'usual',
    LAB = 'lab',
    PRACTICE = 'practice',
    TEST = 'test',
    CONTROL = 'control'
}

@Entity('lessons')
export class Lesson {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Timetable, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'timetable_id' })
    timetable!: Timetable;

    @Column({ name: 'timetable_id' })
    timetableId!: number;

    @Column({ type: 'date' })
    date!: Date;

    @Column()
    topic!: string;

    @Column({ type: 'enum', enum: LessonType, default: LessonType.USUAL })
    type!: LessonType;
}