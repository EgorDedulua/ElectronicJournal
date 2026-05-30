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

@Entity('work_comments')
export class WorkComment {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Work, (work) => work.comments, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'work_id' })
    work!: Work;

    @Column({ name: 'work_id' })
    workId!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'author_id' })
    author!: User;

    @Column({ name: 'author_id' })
    authorId!: number;

    @OneToOne(() => WorkComment, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_id' })
    parent?: WorkComment;

    @Column({ name: 'parent_id', nullable: true })
    parentId?: number;

    @Column()
    text!: string;
}