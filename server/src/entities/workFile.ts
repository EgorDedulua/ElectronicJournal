import {
    Column,
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
    mimeType!: string;

    @Column()
    size!: number;

    @Column()
    uploadedAt!: Date;

    @ManyToOne(() => Work, (work) => work.files, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'work_id' })
    work!: Work;

    @Column({ name: 'work_id' })
    workId!: number;
}