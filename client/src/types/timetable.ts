export interface TimetableEntryDTO {
  courseId: number;
  dayOfWeek: number;
  room: string;
  lessonNumber: number;
}

export interface TimetableLesson {
  id: number;
  courseId: number;
  subjectName: string;
  teacherName: string;
  room: string;
  lessonNumber: number;
  startTime: string;
  endTime: string;
  groupName?: string;
}

export interface TimetableDay {
  dayOfWeek: number;
  lessons: TimetableLesson[];
}
