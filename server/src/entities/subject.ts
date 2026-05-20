import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
} from 'typeorm';
import { Course } from './course';

@Entity('subjects')
export class Subject {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ unique: true })
    name!: string;

    @OneToMany(() => Course, (course) => course.subject)
    courses!: Course[];
}