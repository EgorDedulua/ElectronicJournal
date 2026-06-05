export type LessonType = 'usual' | 'lab' | 'practice' | 'test' | 'control';

export interface Lesson {
  id: number;
  date: string;
  topic: string;
  type: LessonType | string;
  courseId: number;
  workId?: number | null;
}

export const lessonTypeLabels: Record<string, string> = {
  lab: 'Лабораторная',
  practice: 'Практика',
  usual: 'Урок',
  test: 'Тест',
  control: 'Контрольная',
};
