export interface GroupsQueryDTO {
    searchString?: string;
    sort?: 'ASC' | 'DESC';
    page?: number;
    pageSize?: number;
}