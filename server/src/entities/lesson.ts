import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Course } from './course';

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

    @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'course_id' })
    course!: Course;

    @Column({ name: 'course_id' })
    courseId!: number;
    
    @Column({ type: 'date' })
    date!: string;

    @Column()
    topic!: string;

    @Column({ type: 'enum', enum: LessonType, default: LessonType.USUAL })
    type!: LessonType;
}