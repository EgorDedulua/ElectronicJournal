import { formatSolutionDateTime, wasEntityEdited } from '../utils/solutionSubmission';

interface EntityTimestampsMetaProps {
  createdAt: string;
  updatedAt?: string | null;
  createdLabel?: string;
  updatedLabel?: string;
}

const EntityTimestampsMeta = ({
  createdAt,
  updatedAt,
  createdLabel = 'Создано',
  updatedLabel = 'Изменено',
}: EntityTimestampsMetaProps) => {
  const showEdited = wasEntityEdited({ createdAt, updatedAt });

  return (
    <div className="solution-submission-meta">
      <span className="solution-submission-date">
        {createdLabel}: {formatSolutionDateTime(createdAt)}
      </span>
      {showEdited && updatedAt && (
        <span className="solution-submission-date">
          {updatedLabel}: {formatSolutionDateTime(updatedAt)}
        </span>
      )}
    </div>
  );
};

export default EntityTimestampsMeta;
