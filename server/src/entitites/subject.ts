import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from 'typeorm';

@Entity('subjects')
export class Subject {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ unique: true })
    name!: string;
}