import { ReactNode } from 'react';
import { TimetableLesson } from '../types';
import { dayNames, dayNamesShort } from '../utils/dayNames';
import ScheduleLessonCard from './ScheduleLessonCard';

export interface ScheduleGridProps {
  days: number[];
  getLessonsForDay: (dayOfWeek: number) => TimetableLesson[];
  showTeacher?: boolean;
  showGroup?: boolean;
  showRoom?: boolean;
  renderLessonActions?: (lesson: TimetableLesson, dayOfWeek: number) => ReactNode;
  renderDayFooter?: (dayOfWeek: number, lessonCount: number) => ReactNode;
}

const ScheduleGrid = ({
  days,
  getLessonsForDay,
  showTeacher = false,
  showGroup = false,
  showRoom = true,
  renderLessonActions,
  renderDayFooter,
}: ScheduleGridProps) => {
  return (
    <div className="schedule-grid">
      {days.map((dayOfWeek) => {
        const lessons = [...getLessonsForDay(dayOfWeek)].sort(
          (a, b) => a.lessonNumber - b.lessonNumber
        );

        return (
          <div key={dayOfWeek} className="schedule-day-card">
            <div
              className="schedule-day-title"
              title={dayNames[dayOfWeek] ?? `День ${dayOfWeek}`}
            >
              {dayNamesShort[dayOfWeek] ?? `День ${dayOfWeek}`}
            </div>
            <div className="schedule-day-list">
              {lessons.map((lesson) => (
                <ScheduleLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  showTeacher={showTeacher}
                  showGroup={showGroup}
                  showRoom={showRoom}
                  actions={renderLessonActions?.(lesson, dayOfWeek)}
                />
              ))}
              {renderDayFooter?.(dayOfWeek, lessons.length)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleGrid;
