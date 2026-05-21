export interface UsersQueryDTO {
    searchString?: string;
    sort?: 'ASC' | 'DESC';
    role?: 'student' | 'admin' | 'teacher';
    groupIds?: number[];
    page?: number;
    pageSize?: number;
}