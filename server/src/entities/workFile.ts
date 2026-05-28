import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Work } from './work';

@Entity('work_files')
export class WorkFile {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    originalName!: string;

    @Column()
    storedName!: string;

    @Column()
    mimetype!: string;

    @Column()
    size!: number;

    @CreateDateColumn()
    uploadedAt!: Date;

    @ManyToOne(() => Work, (work) => work.files, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'work_id' })
    work!: Work;

    @Column({ name: 'work_id' })
    workId!: number;
}