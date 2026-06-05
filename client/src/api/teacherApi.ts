import httpClient from './httpClient';
import type { Subject } from '../types/subject';

function unwrapSubjects(response: { data: unknown }): Subject[] {
  const body = response.data as Subject[] | { data?: Subject[] };
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object' && Array.isArray(body.data)) {
    return body.data;
  }
  return [];
}

export async function getTeacherSubjects(groupId: number): Promise<Subject[]> {
  const response = await httpClient.get(`/teacher/groups/${groupId}/subjects`);
  return unwrapSubjects(response);
}

export async function teacherCanEditSubject(
  groupId: number,
  subjectId: number
): Promise<boolean> {
  const subjects = await getTeacherSubjects(groupId);
  const subject = subjects.find((s) => s.id === subjectId);
  return subject != null && subject.canEdit !== false;
}
