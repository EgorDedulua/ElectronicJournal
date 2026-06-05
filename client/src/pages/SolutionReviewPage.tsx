import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import httpClient from '../api/httpClient';
import { SolutionData } from '../types/solution';
import { CreditRecord, MarkRecord } from '../types/journal';
import { Lesson } from '../types/lesson';
import { CommentThread } from '../components/CommentThread';
import { useComments } from '../hooks/useComments';
import { useTeacherSubjectAccess } from '../hooks/useTeacherSubjectAccess';
import { useAuth } from '../context/AuthContext';
import { FileList } from '../components/FileListItem';
import SolutionSubmissionMeta from '../components/SolutionSubmissionMeta';
import {
  getTeacherSolution,
  getTeacherWork,
  getTeacherMarks,
  getTeacherCredits,
  addMark,
  deleteMark,
  deleteCredit,
  updateMark,
} from '../api/worksApi';
import { getApiErrorMessage, logApiError } from '../utils/apiError';

export const SolutionReviewPage: React.FC = () => {
  const { solutionId, groupId, subjectId, lessonId, workId } = useParams<{
    solutionId: string;
    groupId: string;
    subjectId: string;
    lessonId: string;
    workId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const gId = Number(groupId);
  const sId = Number(subjectId);
  const lId = Number(lessonId);
  const wId = Number(workId);
  const solId = Number(solutionId);

  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [workDeadline, setWorkDeadline] = useState<string | undefined>();
  const [existingMark, setExistingMark] = useState<MarkRecord | null>(null);
  const [existingCredit, setExistingCredit] = useState<CreditRecord | null>(null);
  const [markValue, setMarkValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [lessonType, setLessonType] = useState<string | null>(null);

  const { canEdit: teacherCanEdit, isChecking: isCheckingTeacherAccess } =
    useTeacherSubjectAccess({
      groupId: gId,
      subjectId: sId,
      enabled: Boolean(gId && sId),
    });

  const isTeacherAccessPending =
    isCheckingTeacherAccess || teacherCanEdit !== true;

  const commentScope = useMemo(
    () => ({
      groupId: gId,
      subjectId: sId,
      lessonId: lId,
      workId: wId,
      solutionId: solId,
      isTeacher: true,
    }),
    [gId, sId, lId, wId, solId]
  );

  const {
    comments,
    hasMore,
    isLoading: commentsLoading,
    load: loadComments,
    loadMore,
    add: addComment,
    edit: editComment,
    remove: removeComment,
  } = useComments(commentScope);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    if (teacherCanEdit !== true) {
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const [sol, work, marks, credits, lessons] = await Promise.all([
          getTeacherSolution({ groupId: gId, subjectId: sId, lessonId: lId, workId: wId, solutionId: solId }),
          getTeacherWork({ groupId: gId, subjectId: sId, lessonId: lId, workId: wId }),
          getTeacherMarks(gId, sId),
          getTeacherCredits(gId, sId),
          httpClient.get(`/teacher/groups/${gId}/subjects/${sId}/lessons`),
        ]);
        setSolution(sol);
        setWorkDeadline(work.deadline);
        const mark = marks.find(
          (m) => m.lessonId === lId && m.studentId === sol.studentId
        );
        setExistingMark(mark ?? null);
        setMarkValue(mark ? String(mark.mark) : '');

        const credit = credits.find(
          (c) => c.lessonId === lId && c.studentId === sol.studentId
        );
        setExistingCredit(credit ?? null);
        const lessonData: Lesson[] = lessons.data.data ?? lessons.data;
        const currentLesson = lessonData.find((lesson) => lesson.id === lId);
        setLessonType(currentLesson?.type ?? null);
        setError(null);
      } catch (err: unknown) {
        logApiError('loadSolution', err);
        setError(getApiErrorMessage(err, 'Не удалось загрузить решение'));
      } finally {
        setIsLoading(false);
      }
    };
    if (solId && gId && sId && lId && wId) load();
  }, [solId, gId, sId, lId, wId, teacherCanEdit]);

  const goBack = () => {
    navigate(`/teacher/work/${wId}/${gId}/${sId}/${lId}`);
  };

  const handleSubmitGrade = async () => {
    const mark = Number(markValue);
    if (!solution || Number.isNaN(mark) || mark < 1 || mark > 10) {
      setModalError('Укажите оценку от 1 до 10');
      return;
    }
    setIsSubmitting(true);
    setModalError(null);
    try {
      // Зачёт на бэкенде меняется автоматически от оценки (>= 3 для lab/practice).
      // Здесь сохраняем оценку и затем перечитываем кредиты, чтобы UI всегда совпадал с сервером.
      if (existingMark) {
        const updated = await updateMark(gId, sId, lId, existingMark.id, mark);
        setExistingMark(updated);
      } else {
        const created = await addMark(gId, sId, lId, solution.studentId, mark);
        setExistingMark(created);
      }

      const credits = await getTeacherCredits(gId, sId);
      const currentCredit = credits.find((c) => c.lessonId === lId && c.studentId === solution.studentId);
      setExistingCredit(currentCredit ?? null);

      setIsGradeModalOpen(false);
    } catch (err: unknown) {
      logApiError('submitGrade', err);
      setModalError(getApiErrorMessage(err, 'Не удалось выставить оценку и зачёт'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMark = async () => {
    if (!existingMark || !solution) return;
    setIsSubmitting(true);
    setModalError(null);
    try {
      await deleteMark(gId, sId, lId, existingMark.id);
      setExistingMark(null);
      setMarkValue('');

      const credits = await getTeacherCredits(gId, sId);
      const currentCredit = credits.find((c) => c.lessonId === lId && c.studentId === solution.studentId);
      setExistingCredit(currentCredit ?? null);
    } catch (err: unknown) {
      logApiError('deleteMark', err);
      setModalError(getApiErrorMessage(err, 'Не удалось убрать отметку'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCredit = async () => {
    if (!existingCredit) return;
    setIsSubmitting(true);
    setModalError(null);
    try {
      await deleteCredit(gId, sId, lId, existingCredit.id);
      setExistingCredit(null);
    } catch (err: unknown) {
      logApiError('deleteCredit', err);
      setModalError(getApiErrorMessage(err, 'Не удалось убрать зачёт'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isTeacherAccessPending) {
    return <div className="page-loading">Загрузка...</div>;
  }

  if (isLoading) {
    return <div className="page-loading">Загрузка...</div>;
  }

  if (!solution) {
    return (
      <div className="work-page">
        <p className="page-error">{error || 'Решение не найдено'}</p>
        <button type="button" className="button button-secondary" onClick={goBack}>
          Назад
        </button>
      </div>
    );
  }

  const openGradeModal = () => {
    setModalError(null);
    setIsGradeModalOpen(true);
    setMarkValue(existingMark ? String(existingMark.mark) : '');
  };

  const closeGradeModal = () => {
    setIsGradeModalOpen(false);
    setModalError(null);
    setMarkValue(existingMark ? String(existingMark.mark) : '');
  };

  const normalizedLessonType = (lessonType ?? solution.lessonType ?? solution.lesson?.type ?? '').toLowerCase();
  const canManageCredit = normalizedLessonType === 'lab' || normalizedLessonType === 'practice';

  return (
    <div className="work-page solution-review-page">
      <div className="work-page-header solution-page-header">
        <button type="button" className="back-button" onClick={goBack}>
          ← К работе
        </button>
        <h1>Решение: {solution.studentName}</h1>
        <SolutionSubmissionMeta solution={solution} deadline={workDeadline} />
      </div>

      <div className="work-page-layout">
        <div className="work-files-column">
          <h3>Файлы решения</h3>
          {solution.files && solution.files.length > 0 ? (
            <FileList files={solution.files} kind="solution" />
          ) : (
            <div className="no-files">Нет файлов</div>
          )}
        </div>

        <div className="work-info-column">
          <div className="work-comments">
            <h4>Комментарии к решению</h4>
            <CommentThread
              comments={comments}
              isLoading={commentsLoading}
              canReply
              canEdit={(authorId) => authorId === user?.id}
              canDelete={(authorId) => authorId === user?.id}
              onAdd={addComment}
              onEdit={editComment}
              onDelete={removeComment}
              currentUserId={user?.id}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </div>
        </div>

        <div className="work-sidebar">
          <h3>Оценить работу</h3>

          <button
            type="button"
            className="button button-primary button-block"
            onClick={openGradeModal}
            disabled={isSubmitting}
          >
            {existingMark || existingCredit ? 'Изменить оценку и зачёт' : 'Выставить оценку и зачёт'}
          </button>

          {(existingMark || existingCredit) && (
            <p className="hint-text">
              {existingMark && (
                <>
                  Оценка: <strong>{existingMark.mark}</strong>
                  {existingCredit ? ', ' : ''}
                </>
              )}
              {existingCredit ? (
                <>
                  Зачёт: <strong>получен</strong>
                </>
              ) : null}
            </p>
          )}

          {error && <p className="form-error">{error}</p>}
        </div>
      </div>

      {isGradeModalOpen && solution && (
        <div className="modal-backdrop" onClick={closeGradeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-label">Оценка и зачёт</div>
                <div className="modal-title">{solution.studentName}</div>
              </div>
              <button type="button" className="modal-close" onClick={closeGradeModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="modal-card-item">
                  <label>Оценка (1–10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={markValue}
                    onChange={(e) => setMarkValue(e.target.value)}
                    disabled={isSubmitting}
                  />

                  <button
                    type="button"
                    className="button button-primary button-block"
                    onClick={handleSubmitGrade}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                  </button>

                  <button
                    type="button"
                    className="button button-secondary button-block"
                    onClick={handleDeleteMark}
                    disabled={isSubmitting || !existingMark}
                  >
                    Убрать отметку
                  </button>

                  {canManageCredit && (
                    <button
                      type="button"
                      className="button button-secondary button-block"
                      onClick={handleDeleteCredit}
                      disabled={isSubmitting || !existingCredit}
                    >
                      Убрать зачет
                    </button>
                  )}
                </div>
              </div>

              {modalError && <p className="form-error">{modalError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
