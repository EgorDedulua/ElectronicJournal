export interface MarkRecord {
  id: number;
  lessonId: number;
  mark: number;
  studentId: number;
  studentName?: string;
}

export interface AbsenceRecord {
  id: number;
  lessonId: number;
  studentId: number;
  studentName?: string;
}

export interface LateRecord {
  id: number;
  lessonId: number;
  studentId: number;
  studentName?: string;
  minutes: number;
}

export interface CreditRecord {
  id: number;
  lessonId: number;
  studentId: number;
}

export interface JournalCell {
  date: string;
  lessonId?: number;
  lessonType?: string;
  lessonTopic?: string;
  mark?: string;
  markId?: number;
  absence?: boolean;
  absenceId?: number;
  lateMinutes?: number;
  lateId?: number;
  credit?: boolean;
  creditId?: number;
  workId?: number | null;
}
