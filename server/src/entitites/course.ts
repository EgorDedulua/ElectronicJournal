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
    @JoinColumn({ name: 'teacherId' })
    teacher!: User;

    @Column()
    teacherId!: number;

    @ManyToOne(() => Group, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupId' })
    group!: Group;

    @Column()
    groupId!: number;

    @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subjectId' })
    subject!: Subject;
}