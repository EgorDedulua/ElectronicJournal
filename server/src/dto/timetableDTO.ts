import { DayOfWeek } from "@/entities/timetable";

export interface TimetableDTO {
    courseId: number;
    dayOfWeek: DayOfWeek;
    room: string;
    lessonNumber: number;
}