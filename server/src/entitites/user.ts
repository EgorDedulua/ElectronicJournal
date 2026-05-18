import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Group } from './group';

export enum UserRole {
    STUDENT = 'student',
    TEACHER = 'teacher'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ unique: true })
    login!: string;

    @Column()
    passwordHash!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
    role!: UserRole;

    @Column()
    fullName!: string;

    @ManyToOne(() => Group, (group) => group.students, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'groupId' })
    group!: Group | null;

    @Column()
    groupId!: number;
}