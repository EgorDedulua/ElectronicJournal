import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Course } from './course';

export enum DayOfWeek {
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6,
    SUNDAY = 7,
};

@Entity('timetables')
export class Timetable {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Course, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'course_id' })
    course!: Course;

    @Column({ name: 'course_id' })
    courseId!: number;

    @Column({ type: 'enum', enum: DayOfWeek })
    dayOfWeek!: DayOfWeek;

    @Column({ type: 'time' })
    startTime!: string;

    @Column({ type: 'time'})
    endTime!: string;

    @Column()
    room!: string;

    @Column()
    lessonNumber!: number;
}