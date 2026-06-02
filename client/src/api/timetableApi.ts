import httpClient from './httpClient';
import type { TimetableDay, TimetableEntryDTO } from '../types/timetable';

function unwrap<T>(response: { data: T }): T {
  const body = response.data as T & { data?: T };
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return body as T;
}

export async function getGroupTimetable(groupId: number): Promise<TimetableDay[]> {
  const res = await httpClient.get('/admin/timetables', { params: { id: groupId } });
  return unwrap<TimetableDay[]>(res);
}

export async function createTimetableEntry(dto: TimetableEntryDTO): Promise<void> {
  await httpClient.post('/admin/timetables', [dto]);
}

export async function updateTimetableEntry(
  timetableId: number,
  dto: TimetableEntryDTO
): Promise<void> {
  await httpClient.put(`/admin/timetables/${timetableId}`, dto);
}

export async function deleteTimetableEntry(timetableId: number): Promise<void> {
  await httpClient.delete(`/admin/timetables/${timetableId}`);
}
