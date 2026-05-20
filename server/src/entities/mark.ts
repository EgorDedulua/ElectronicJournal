import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Lesson } from './lesson';
import { User } from './user';

@Entity('marks')
export class Mark {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    mark!: number;

    @ManyToOne(() => Lesson, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'lesson_id' })
    lesson!: Lesson;

    @Column({ name: 'lesson_id' })
    lessonId!: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'student_id'})
    student!: User;

    @Column({ name: 'student_id'})
    studentId!: number;
}