import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Course } from './course';
import { LessonTimings } from './lessonTimings';
import { Group } from './group';
import { User } from './user';

export enum DayOfWeek {
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6
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

    @Column()
    room!: string;

    @ManyToOne(() => LessonTimings, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'lesson_timings_id' })
    lessonTimings!: LessonTimings;

    @Column({ name: 'lesson_timings_id' })
    lessonTimingsId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teacher_id' })
    teacher!: User;

    @Column({ name: 'teacher_id' })
    teacherId!: number;

    @ManyToOne(() => Group, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'group_id' })
    group!: Group;

    @Column({ name: 'group_id' })
    groupId!: number;
}