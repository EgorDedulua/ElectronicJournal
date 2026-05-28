import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from 'typeorm';
import { Solution } from './solution';

@Entity('solution_files')
export class SolutionFile {
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

    @ManyToOne(() => Solution, (solution) => solution.files, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'solution_id' })
    solution!: Solution;

    @Column({ name: 'solution_id' })
    solutionId!: number;
}