import httpClient from './httpClient';
import type { WorkData, CreateWorkDTO, UpdateWorkDTO } from '../types/work';
import type { SolutionData } from '../types/solution';
import type { CommentBase, CommentsResponse, CreateCommentDTO, UpdateCommentDTO } from '../types/comment';
import type { CreditRecord, MarkRecord } from '../types/journal';

export interface WorkRouteParams {
  groupId: number;
  subjectId: number;
  lessonId: number;
  workId: number;
}

const teacherWorkBase = (p: WorkRouteParams) =>
  `/teacher/groups/${p.groupId}/subjects/${p.subjectId}/lessons/${p.lessonId}/works`;

const studentWorkBase = (subjectId: number, lessonId: number, workId: number) =>
  `/student/subjects/${subjectId}/lessons/${lessonId}/works/${workId}`;

function unwrap<T>(response: { data: T }): T {
  const body = response.data as T & { data?: T };
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return body as T;
}

function buildWorkFormData(
  dto: CreateWorkDTO | UpdateWorkDTO,
  files?: File[],
  deleteFileIds?: number[]
): FormData {
  const form = new FormData();
  if ('title' in dto && dto.title !== undefined) form.append('title', dto.title);
  if (dto.description != null && dto.description.trim() !== '') {
    form.append('description', dto.description.trim());
  }
  if (dto.deadline != null && dto.deadline.trim() !== '') {
    const parsed = new Date(dto.deadline);
    if (!Number.isNaN(parsed.getTime())) {
      form.append('deadline', parsed.toISOString());
    }
  }
  if (deleteFileIds && deleteFileIds.length > 0) {
    form.append('deleteFileIds', JSON.stringify(deleteFileIds));
  }
  files?.forEach((file) => form.append('files', file));
  return form;
}

export async function getTeacherWork(params: WorkRouteParams): Promise<WorkData> {
  const res = await httpClient.get(`${teacherWorkBase(params)}/${params.workId}`);
  return unwrap<WorkData>(res);
}

export async function getStudentWork(
  subjectId: number,
  lessonId: number,
  workId: number
): Promise<WorkData> {
  const res = await httpClient.get(studentWorkBase(subjectId, lessonId, workId));
  return unwrap<WorkData>(res);
}

export async function createWork(
  params: { groupId: number; subjectId: number; lessonId: number },
  dto: CreateWorkDTO,
  files?: File[]
): Promise<WorkData> {
  const form = buildWorkFormData(dto, files);
  const res = await httpClient.post(
    `/teacher/groups/${params.groupId}/subjects/${params.subjectId}/lessons/${params.lessonId}/works`,
    form
  );
  return unwrap<WorkData>(res);
}

export async function deleteWork(params: WorkRouteParams): Promise<void> {
  await httpClient.delete(`${teacherWorkBase(params)}/${params.workId}`);
}

export async function updateWork(
  params: WorkRouteParams,
  dto: UpdateWorkDTO,
  files?: File[],
  deleteFileIds?: number[]
): Promise<WorkData> {
  const form = buildWorkFormData(dto, files, deleteFileIds);
  const res = await httpClient.put(`${teacherWorkBase(params)}/${params.workId}`, form);
  return unwrap<WorkData>(res);
}

export async function getTeacherSolution(params: WorkRouteParams & { solutionId: number }): Promise<SolutionData> {
  const res = await httpClient.get(
    `${teacherWorkBase(params)}/${params.workId}/solutions/${params.solutionId}`
  );
  return unwrap<SolutionData>(res);
}

export async function getStudentSolution(
  subjectId: number,
  lessonId: number,
  workId: number,
  solutionId: number
): Promise<SolutionData> {
  const res = await httpClient.get(
    `${studentWorkBase(subjectId, lessonId, workId)}/solutions/${solutionId}`
  );
  return unwrap<SolutionData>(res);
}

export async function createSolution(
  subjectId: number,
  lessonId: number,
  workId: number,
  files?: File[]
): Promise<SolutionData> {
  const form = new FormData();
  files?.forEach((file) => form.append('files', file));
  const res = await httpClient.post(
    `${studentWorkBase(subjectId, lessonId, workId)}/solutions`,
    form
  );
  return unwrap<SolutionData>(res);
}

export async function updateSolution(
  subjectId: number,
  lessonId: number,
  workId: number,
  solutionId: number,
  files?: File[],
  deleteFileIds?: number[]
): Promise<SolutionData> {
  const form = new FormData();
  if (deleteFileIds && deleteFileIds.length > 0) {
    form.append('deleteFileIds', JSON.stringify(deleteFileIds));
  }
  files?.forEach((file) => form.append('files', file));
  const res = await httpClient.put(
    `${studentWorkBase(subjectId, lessonId, workId)}/solutions/${solutionId}`,
    form
  );
  return unwrap<SolutionData>(res);
}

export async function deleteSolution(
  subjectId: number,
  lessonId: number,
  workId: number,
  solutionId: number
): Promise<void> {
  await httpClient.delete(
    `${studentWorkBase(subjectId, lessonId, workId)}/solutions/${solutionId}`
  );
}

export interface CommentScopeParams {
  groupId?: number;
  subjectId: number;
  lessonId: number;
  workId: number;
  solutionId?: number;
  isTeacher: boolean;
}

function commentsPath(p: CommentScopeParams, commentId?: number): string {
  const { subjectId, lessonId, workId, solutionId, isTeacher, groupId } = p;
  const base = isTeacher
    ? `/teacher/groups/${groupId}/subjects/${subjectId}/lessons/${lessonId}/works/${workId}`
    : `/student/subjects/${subjectId}/lessons/${lessonId}/works/${workId}`;
  if (solutionId != null) {
    const sol = `${base}/solutions/${solutionId}/comments`;
    return commentId != null ? `${sol}/${commentId}` : sol;
  }
  const workComments = `${base}/comments`;
  return commentId != null ? `${workComments}/${commentId}` : workComments;
}

export async function getComments(
  p: CommentScopeParams,
  offset = 0,
  limit = 20
): Promise<CommentsResponse> {
  const res = await httpClient.get(commentsPath(p), { params: { offset, limit } });
  return res.data as CommentsResponse;
}

export async function createComment(
  p: CommentScopeParams,
  dto: CreateCommentDTO
): Promise<CommentBase> {
  const res = await httpClient.post(commentsPath(p), dto);
  const body = res.data as { data?: CommentBase };
  return body.data ?? (res.data as CommentBase);
}

export async function updateComment(
  p: CommentScopeParams,
  commentId: number,
  dto: UpdateCommentDTO
): Promise<CommentBase> {
  const res = await httpClient.put(commentsPath(p, commentId), dto);
  const body = res.data as { data?: CommentBase };
  return body.data ?? (res.data as CommentBase);
}

export async function deleteComment(p: CommentScopeParams, commentId: number): Promise<void> {
  await httpClient.delete(commentsPath(p, commentId));
}

export async function getTeacherMarks(
  groupId: number,
  subjectId: number
): Promise<MarkRecord[]> {
  const res = await httpClient.get(
    `/teacher/groups/${groupId}/subjects/${subjectId}/marks`
  );
  const body = res.data as { data?: MarkRecord[] };
  return Array.isArray(body.data) ? body.data : (res.data as MarkRecord[]);
}

export async function addMark(
  groupId: number,
  subjectId: number,
  lessonId: number,
  studentId: number,
  mark: number
): Promise<MarkRecord> {
  const res = await httpClient.post(
    `/teacher/groups/${groupId}/subjects/${subjectId}/lessons/${lessonId}/marks`,
    { studentId, mark }
  );
  const body = res.data as { data?: MarkRecord };
  return body.data ?? (res.data as MarkRecord);
}

export async function updateMark(
  groupId: number,
  subjectId: number,
  lessonId: number,
  markId: number,
  mark: number
): Promise<MarkRecord> {
  const res = await httpClient.patch(
    `/teacher/groups/${groupId}/subjects/${subjectId}/lessons/${lessonId}/marks/${markId}`,
    { mark }
  );
  const body = res.data as { data?: MarkRecord };
  return body.data ?? (res.data as MarkRecord);
}

export async function deleteMark(
  groupId: number,
  subjectId: number,
  lessonId: number,
  markId: number
): Promise<void> {
  await httpClient.delete(
    `/teacher/groups/${groupId}/subjects/${subjectId}/lessons/${lessonId}/marks/${markId}`
  );
}

export async function getTeacherCredits(
  groupId: number,
  subjectId: number
): Promise<CreditRecord[]> {
  const res = await httpClient.get(
    `/teacher/groups/${groupId}/subjects/${subjectId}/credits`
  );
  const body = res.data as { data?: CreditRecord[] };
  return Array.isArray(body.data) ? body.data : (res.data as CreditRecord[]);
}

export async function addCredit(
  groupId: number,
  subjectId: number,
  lessonId: number,
  studentId: number
): Promise<CreditRecord> {
  const res = await httpClient.post(
    `/teacher/groups/${groupId}/subjects/${subjectId}/lessons/${lessonId}/credits`,
    { studentId }
  );
  const body = res.data as { data?: CreditRecord };
  return body.data ?? (res.data as CreditRecord);
}

export async function deleteCredit(
  groupId: number,
  subjectId: number,
  lessonId: number,
  creditId: number
): Promise<void> {
  await httpClient.delete(
    `/teacher/groups/${groupId}/subjects/${subjectId}/lessons/${lessonId}/credits/${creditId}`
  );
}
