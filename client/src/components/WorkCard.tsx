import React from 'react';
import { WorkData } from '../types';

interface WorkCardProps {
  work: WorkData;
  onView?: (workId: number) => void;
  isClickable?: boolean;
}

export const WorkCard: React.FC<WorkCardProps> = ({
  work,
  onView,
  isClickable = true,
}) => {
  const handleClick = () => {
    if (isClickable && onView) {
      onView(work.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && onView && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onView(work.id);
    }
  };

  return (
    <div
      className={`work-card ${isClickable ? 'work-card-clickable' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div className="work-title" title={work.title}>
        {work.title}
      </div>
      {work.deadline && (
        <div className="work-deadline">
          Срок: {new Date(work.deadline).toLocaleDateString('ru-RU')}
        </div>
      )}
      {work.files && work.files.length > 0 && (
        <div className="work-files-count">
          📎 {work.files.length}
        </div>
      )}
    </div>
  );
};
