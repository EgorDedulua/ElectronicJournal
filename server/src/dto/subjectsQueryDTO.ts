export interface SubjectsQueryDTO {
    searchString?: string;
    sort?: 'ASC' | 'DESC';
    groupIds?: number[];
    page?: number;
    pageSize?: number;
}