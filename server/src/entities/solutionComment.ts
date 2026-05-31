import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from 'typeorm';
import { Work } from './work';
import { User } from './user';
import { Solution } from './solution';

@Entity('solution_comments')
export class SolutionComment {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Solution, (solution) => solution.comments, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'solution_id' })
    solution!: Work;

    @Column({ name: 'solution_id' })
    solutionId!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn({ nullable: true })
    updatedAt?: Date;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author!: User;

    @Column({ name: 'author_id' })
    authorId!: number;

    @OneToOne(() => SolutionComment, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_id' })
    parent?: SolutionComment;

    @Column({ name: 'parent_id' })
    parentId?: number;

    @Column()
    text!: string;
}