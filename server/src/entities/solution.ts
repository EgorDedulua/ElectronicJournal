import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Work } from './work';
import { User } from './user';
import { SolutionFile } from './solutionFile';
import { SolutionComment } from './solutionComment';

@Entity('solutions')
export class Solution {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Work, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'work_id' })
    work!: Work;

    @Column({ name: 'work_id' })
    workId!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: 'timestamp', nullable: true })
    updatedAt?: Date | null;

    @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'student_id' })
    student!: User;

    @Column({ name: 'student_id' })
    studentId!: number;

    @OneToMany(() => SolutionFile, (file) => file.solution, { onDelete: 'CASCADE' })
    files!: SolutionFile[];

    @OneToMany(() => SolutionComment, (comment) => comment.solution, { onDelete: 'CASCADE' })
    comments!: SolutionComment[];
}