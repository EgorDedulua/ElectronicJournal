export interface RegisterDTO {
    login: string;
    password?: string;
    fullName: string;
    groupId?: number;
    role: 'student' | 'teacher';
}