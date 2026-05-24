export interface UpdateUserDTO {
    login?: string;
    password?: string;
    fullName?: string;
    groupId?: number;
    role?: 'student' | 'teacher';
    isExpelled?: boolean;
}