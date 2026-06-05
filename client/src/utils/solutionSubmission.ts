export type SubmissionTimeliness = 'on-time' | 'late';

export function formatSolutionDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function wasSolutionEdited(solution: {
  createdAt: string;
  updatedAt?: string | null;
}): boolean {
  return solution.updatedAt != null && solution.updatedAt !== '';
}

export function wasEntityEdited(entity: {
  createdAt: string;
  updatedAt?: string | null;
}): boolean {
  if (entity.updatedAt == null || entity.updatedAt === '') return false;
  const created = new Date(entity.createdAt).getTime();
  const updated = new Date(entity.updatedAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(updated)) return false;
  return updated > created + 1000;
}

export function getSolutionLastActivityAt(solution: {
  createdAt: string;
  updatedAt?: string | null;
}): Date {
  if (wasSolutionEdited(solution)) {
    return new Date(solution.updatedAt!);
  }
  return new Date(solution.createdAt);
}

export function getDeadlineEnd(deadlineIso: string): Date {
  const end = new Date(deadlineIso);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getSubmissionTimeliness(
  deadline: string | undefined,
  solution: { createdAt: string; updatedAt?: string | null }
): SubmissionTimeliness {
  if (!deadline) return 'on-time';
  const lastAt = getSolutionLastActivityAt(solution);
  const deadlineEnd = getDeadlineEnd(deadline);
  return lastAt.getTime() <= deadlineEnd.getTime() ? 'on-time' : 'late';
}
