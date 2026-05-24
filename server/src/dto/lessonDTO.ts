import { LessonType } from "@/entities/lesson";

export interface LessonDTO {
    date: string;
    topic?: string;
    type: LessonType;
}