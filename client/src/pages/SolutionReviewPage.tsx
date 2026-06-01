import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SolutionData, CommentWithReplies } from '../types';

export const SolutionReviewPage: React.FC = () => {
  const { solutionId } = useParams<{ solutionId: string }>();
  const navigate = useNavigate();

  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mark, setMark] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSolution = async () => {
      try {
        setIsLoading(true);
        // TODO: Fetch solution data from API
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load solution');
      } finally {
        setIsLoading(false);
      }
    };

    if (solutionId) {
      loadSolution();
    }
  }, [solutionId]);

  const handleSubmitGrade = async () => {
    if (mark === null) {
      setError('Пожалуйста, укажите оценку');
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Submit grade via API
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <div className="page-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  if (!solution) {
    return <div className="page-not-found">Решение не найдено</div>;
  }

  return (
    <div className="solution-review-page">
      <div className="solution-page-header">
        <button className="back-button" onClick={goBack}>
          ← Назад
        </button>
        <h1>Проверка решения</h1>
      </div>

      <div className="solution-review-layout">
        {/* Left column: Solution files */}
        <div className="solution-files-column">
          <h3>Файлы решения</h3>
          {solution.files && solution.files.length > 0 ? (
            <div className="file-list">
              {solution.files.map((file) => (
                <div key={file.id} className="file-item">
                  <a href="#" download>
                    {file.originalName}
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-files">Нет файлов</div>
          )}
        </div>

        {/* Middle column: Solution info and comments */}
        <div className="solution-info-column">
          <div className="solution-student">
            <strong>Студент:</strong> {solution.student?.fullName}
          </div>

          <div className="solution-date">
            <strong>Дата сдачи:</strong> {new Date(solution.createdAt).toLocaleString('ru-RU')}
          </div>

          <div className="solution-comments">
            <h4>Комментарии</h4>
            {/* TODO: Render CommentThread component here */}
          </div>
        </div>

        {/* Right column: Grading panel */}
        <div className="grading-panel">
          <h3>Оценивание</h3>

          <div className="grade-input">
            <label>Оценка</label>
            <input
              type="number"
              min="1"
              max="100"
              value={mark ?? ''}
              onChange={(e) => setMark(e.target.value ? parseInt(e.target.value) : null)}
              disabled={isSubmitting}
            />
          </div>

          <div className="feedback-input">
            <label>Комментарий</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Введите комментарий для студента..."
              disabled={isSubmitting}
              rows={5}
            />
          </div>

          <button
            className="submit-grade-btn"
            onClick={handleSubmitGrade}
            disabled={isSubmitting || mark === null}
          >
            Оценить работу
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};
