export interface CoursesQueryDTO {
    groupIds?: number[];
    subjectIds?: number[];
    searchString?: string;
    sort?: 'ASC' | 'DESC';
    page?: number;
    pageSize?: number;
}