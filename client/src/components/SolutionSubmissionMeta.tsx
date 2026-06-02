import {
  formatSolutionDateTime,
  getSubmissionTimeliness,
  wasSolutionEdited,
} from '../utils/solutionSubmission';

interface SolutionSubmissionMetaProps {
  solution: {
    createdAt: string;
    updatedAt?: string | null;
  };
  deadline?: string;
}

const SolutionSubmissionMeta = ({ solution, deadline }: SolutionSubmissionMetaProps) => {
  const timeliness = getSubmissionTimeliness(deadline, solution);
  const showEdited = wasSolutionEdited(solution);

  return (
    <div className="solution-submission-meta">
      <span className="solution-submission-date">
        Добавлено: {formatSolutionDateTime(solution.createdAt)}
      </span>
      {showEdited && solution.updatedAt && (
        <span className="solution-submission-date">
          Изменено: {formatSolutionDateTime(solution.updatedAt)}
        </span>
      )}
      {timeliness === 'on-time' ? (
        <span className="solution-submission-status solution-submission-status-ok">Сдано</span>
      ) : (
        <span className="solution-submission-status solution-submission-status-late">
          Пропущен срок сдачи
        </span>
      )}
    </div>
  );
};

export default SolutionSubmissionMeta;
