import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from './user';
import { Group } from './group';
import { Subject } from './subject';

@Entity('courses')
export class Course {
    @PrimaryGeneratedColumn('increment')
    id!: number;

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

    @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subject_id' })
    subject!: Subject;

    @Column({ name: 'subject_id' })
    subjectId!: number;
}