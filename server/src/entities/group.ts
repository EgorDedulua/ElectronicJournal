import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import { User } from './user';
import { Course } from './course';

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ unique: true })
    name!: string;
    
    @OneToMany(() => User, (user) => user.group)
    students!: User[];

    @OneToMany(() => Course, (course) => course.group)
    courses!: Course[];
}