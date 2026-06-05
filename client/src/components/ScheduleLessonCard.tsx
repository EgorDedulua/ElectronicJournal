import { ReactNode } from 'react';
import { TimetableLesson } from '../types';
import { formatTeacherShortName } from '../utils/formatTeacherShortName';
import { formatTime } from '../utils/formatTime';

export interface ScheduleLessonCardProps {
  lesson: TimetableLesson;
  showTeacher?: boolean;
  showGroup?: boolean;
  showRoom?: boolean;
  actions?: ReactNode;
}

const ScheduleLessonCard = ({
  lesson,
  showTeacher = false,
  showGroup = false,
  showRoom = true,
  actions,
}: ScheduleLessonCardProps) => {
  const timeLabel = `${formatTime(lesson.startTime)} – ${formatTime(lesson.endTime)}`;
  const teacherLine =
    showTeacher && lesson.teacherName
      ? formatTeacherShortName(lesson.teacherName)
      : null;

  return (
    <div className="schedule-item" title={timeLabel || undefined}>
      <div className="schedule-item-inner">
        <span className="lesson-number">{lesson.lessonNumber}</span>
        <div className="lesson-details">
          <div className="lesson-subject">{lesson.subjectName}</div>
          {teacherLine ? <div className="lesson-meta-line">{teacherLine}</div> : null}
          {showRoom && lesson.room ? (
            <div className="lesson-meta-line">{lesson.room}</div>
          ) : null}
          {showGroup && lesson.groupName ? (
            <div className="lesson-meta-line">{lesson.groupName}</div>
          ) : null}
        </div>
        {actions ? <div className="schedule-item-actions">{actions}</div> : null}
      </div>
    </div>
  );
};

export default ScheduleLessonCard;
