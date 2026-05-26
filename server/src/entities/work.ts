import {
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Lesson } from './lesson';
import { WorkFile } from './workFile';
import { Solution } from './solution';
import { WorkComment } from './workComment';

@Entity('works')
export class Work {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    title!: string;

    @Column()
    description?: string;

    @OneToOne(() => Lesson, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lesson_id' })
    lesson!: Lesson;

    @Column({ name: 'lesson_id' })
    lessonId!: number;

    @Column()
    deadline?: Date;

    @Column()
    createdAt!: Date;

    @Column()
    updatedAt?: Date;

    @OneToMany(() => WorkFile, (file) => file.work, { onDelete: 'CASCADE' })
    files?: WorkFile[];

    @OneToMany(() => Solution, (solution) => solution.work, { onDelete: 'CASCADE' })
    solutions?: Solution[];

    @OneToMany(() => WorkComment, (comment) => comment.work, { onDelete: 'CASCADE' })
    comments?: WorkComment[];
}