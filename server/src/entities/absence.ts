import {
    Entity,
    PrimaryGeneratedColumn,
    JoinColumn,
    ManyToOne,
    Column
} from 'typeorm';
import { Lesson } from './lesson';
import { User } from './user';

@Entity('absences')
export class Absence {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Lesson, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'lesson_id' })
    lesson!: Lesson;

    @Column({ name: 'lesson_id' })
    lessonId!:number;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
    @JoinColumn({ name: 'student_id'})
    student!: User;

    @Column({ name: 'student_id'})
    studentId!: number;
}