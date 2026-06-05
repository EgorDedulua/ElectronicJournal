import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkData, WorkFile } from '../types/work';
import { FileUploadArea } from '../components/FileUploadArea';
import { CommentThread } from '../components/CommentThread';
import { useComments } from '../hooks/useComments';
import { useTeacherSubjectAccess } from '../hooks/useTeacherSubjectAccess';
import { useAuth } from '../context/AuthContext';
import {
  getTeacherWork,
  getStudentWork,
  createWork,
  updateWork,
  deleteWork,
} from '../api/worksApi';
import EntityTimestampsMeta from '../components/EntityTimestampsMeta';
import { FileList } from '../components/FileListItem';
import { getApiErrorMessage, logApiError } from '../utils/apiError';
import {
  formatSolutionDateTime,
  getSubmissionTimeliness,
  wasSolutionEdited,
} from '../utils/solutionSubmission';

interface PendingFile {
  id: number;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  file?: File;
}

interface WorkPageProps {
  isTeacher?: boolean;
}

export const WorkPage: React.FC<WorkPageProps> = ({ isTeacher = false }) => {
  const { groupId, subjectId, lessonId, workId } = useParams<{
    groupId?: string;
    subjectId?: string;
    lessonId?: string;
    workId?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreateMode = !workId || workId === 'new';
  const gId = groupId ? Number(groupId) : 0;
  const sId = subjectId ? Number(subjectId) : 0;
  const lId = lessonId ? Number(lessonId) : 0;
  const wId = workId && workId !== 'new' ? Number(workId) : 0;

  const [work, setWork] = useState<WorkData | null>(null);
  const [isLoading, setIsLoading] = useState(!isCreateMode);
  const [error, setError] = useState<string | null>(null);

  const [workTitle, setWorkTitle] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workDeadline, setWorkDeadline] = useState('');
  const [existingWorkFiles, setExistingWorkFiles] = useState<WorkFile[]>([]);
  const [pendingWorkFiles, setPendingWorkFiles] = useState<PendingFile[]>([]);
  const [deleteWorkFileIds, setDeleteWorkFileIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [studentSolutionId, setStudentSolutionId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const { canEdit: teacherCanEdit, isChecking: isCheckingTeacherAccess } =
    useTeacherSubjectAccess({
      groupId: gId,
      subjectId: sId,
      enabled: isTeacher && Boolean(gId && sId),
    });

  const isTeacherAccessPending =
    isTeacher && (isCheckingTeacherAccess || teacherCanEdit !== true);

  const commentScope = useMemo(() => {
    if (isCreateMode || !wId) return null;
    return {
      groupId: gId,
      subjectId: sId,
      lessonId: lId,
      workId: wId,
      isTeacher,
    };
  }, [isCreateMode, wId, gId, sId, lId, isTeacher]);

  const {
    comments,
    hasMore,
    isLoading: commentsLoading,
    error: commentsError,
    load: loadComments,
    loadMore,
    add: addComment,
    edit: editComment,
    remove: removeComment,
  } = useComments(commentScope);

  useEffect(() => {
    if (commentScope) loadComments();
  }, [commentScope, loadComments]);

  const goBack = () => {
    if (isTeacher) {
      const savedState = sessionStorage.getItem('journalReturnState');
      if (savedState) {
        sessionStorage.removeItem('journalReturnState');
      }
      navigate('/teacher', { replace: true });
      return;
    }
    sessionStorage.setItem('studentActiveTab', 'journal');
    navigate('/student', { replace: true });
  };

  useEffect(() => {
    if (isCreateMode) {
      setIsLoading(false);
      return;
    }

    if (isTeacher && teacherCanEdit !== true) {
      return;
    }

    const loadWork = async () => {
      if (!gId || !sId || !lId || !wId) {
        setError('Неверные параметры');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = isTeacher
          ? await getTeacherWork({ groupId: gId, subjectId: sId, lessonId: lId, workId: wId })
          : await getStudentWork(sId, lId, wId);
        setWork(data);
        setWorkTitle(data.title);
        setWorkDescription(data.description ?? '');
        setWorkDeadline(data.deadline ? data.deadline.substring(0, 10) : '');
        setExistingWorkFiles(data.files ?? []);

        setStudentSolutionId(isTeacher ? null : data.solutionId ?? null);
        setError(null);
      } catch (err: unknown) {
        logApiError('loadWork', err);
        setError(getApiErrorMessage(err, 'Не удалось загрузить работу'));
      } finally {
        setIsLoading(false);
      }
    };

    loadWork();
  }, [isCreateMode, isTeacher, teacherCanEdit, gId, sId, lId, wId]);

  const handleCreateWork = async () => {
    if (!workTitle.trim() || !gId || !sId || !lId) {
      setSubmitError('Укажите название работы');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const created = await createWork(
        { groupId: gId, subjectId: sId, lessonId: lId },
        {
          title: workTitle,
          description: workDescription || undefined,
          deadline: workDeadline || undefined,
        },
        pendingWorkFiles.map((f) => f.file!).filter(Boolean)
      );
      navigate(`/teacher/work/${created.id}/${gId}/${sId}/${lId}`, { replace: true });
    } catch (err: unknown) {
      logApiError('createWork', err);
      setSubmitError(getApiErrorMessage(err, 'Не удалось создать работу'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWork = async () => {
    if (!work || !gId || !sId || !lId || !isTeacher) return;
    if (!window.confirm('Удалить работу? Все решения и комментарии будут удалены.')) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await deleteWork({ groupId: gId, subjectId: sId, lessonId: lId, workId: work.id });
      goBack();
    } catch (err: unknown) {
      logApiError('deleteWork', err);
      setSubmitError(getApiErrorMessage(err, 'Не удалось удалить работу'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWork = async () => {
    if (!work || !gId || !sId || !lId) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const updated = await updateWork(
        { groupId: gId, subjectId: sId, lessonId: lId, workId: work.id },
        {
          title: workTitle,
          description: workDescription,
          deadline: workDeadline || undefined,
        },
        pendingWorkFiles.map((f) => f.file!).filter(Boolean),
        deleteWorkFileIds
      );
      setWork(updated);
      setExistingWorkFiles(updated.files ?? []);
      setPendingWorkFiles([]);
      setDeleteWorkFileIds([]);
      setIsEditMode(false);
    } catch (err: unknown) {
      logApiError('updateWork', err);
      setSubmitError(getApiErrorMessage(err, 'Не удалось обновить работу'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPendingFiles = (
    fileList: FileList,
    setter: React.Dispatch<React.SetStateAction<PendingFile[]>>,
    current: PendingFile[],
    max: number
  ) => {
    const looksLikeMojibake = (name: string): boolean => {
      return (
        name.includes('\uFFFD') ||
        /[ÃÐÑÒÓÔÕÖ×ØÙÚÛÜÝ]/.test(name) ||
        /[Ââ]/.test(name)
      );
    };

    const fixMojibakeFilename = (name: string): string => {
      if (!looksLikeMojibake(name)) return name;
      try {
        // Восстанавливаем байты (как latin1-строку) и декодируем их как UTF-8.
        const bytes = new Uint8Array(Array.from(name, (ch) => ch.charCodeAt(0) & 0xff));
        return new TextDecoder('utf-8').decode(bytes);
      } catch {
        return name;
      }
    };

    const remaining = max - current.length;
    const toAdd = Array.from(fileList).slice(0, remaining);
    const mapped = toAdd.map((file, index) => ({
      id: Date.now() + index,
      originalName: fixMojibakeFilename(file.name),
      size: file.size,
      mimetype: file.type,
      uploadedAt: new Date().toISOString(),
      file,
    }));
    setter([...current, ...mapped]);
  };

  const toggleDeleteWorkFile = (id: number) => {
    setDeleteWorkFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (isTeacherAccessPending) {
    return <div className="page-loading">Загрузка...</div>;
  }

  if (isLoading) {
    return <div className="page-loading">Загрузка...</div>;
  }

  if (error && !isCreateMode) {
    return (
      <div className="work-page">
        <div className="page-error">{error}</div>
        <button type="button" className="button button-secondary" onClick={goBack}>
          Назад
        </button>
      </div>
    );
  }

  if (isCreateMode && isTeacher) {
    return (
      <div className="work-page">
        <div className="modal-backdrop work-create-backdrop">
          <div className="modal-card work-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-label">Новая работа</div>
                <div className="modal-title">Добавление работы к уроку</div>
              </div>
              <button type="button" className="modal-close" onClick={goBack}>
                ×
              </button>
            </div>
            <div className="modal-body work-create-body">
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={workTitle}
                  onChange={(e) => setWorkTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label>Срок сдачи</label>
                <input
                  type="date"
                  value={workDeadline}
                  onChange={(e) => setWorkDeadline(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label>Файлы (до 10)</label>
                <FileUploadArea
                  files={pendingWorkFiles}
                  onFilesSelected={(files) =>
                    addPendingFiles(files, setPendingWorkFiles, pendingWorkFiles, 10)
                  }
                  onFileDeleted={(id) =>
                    setPendingWorkFiles((prev) => prev.filter((f) => f.id !== id))
                  }
                  isLoading={isSubmitting}
                  maxFiles={10}
                />
              </div>
              {submitError && <p className="form-error">{submitError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleCreateWork}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Создание...' : 'Создать'}
                </button>
                <button type="button" className="button button-secondary" onClick={goBack} disabled={isSubmitting}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!work) {
    return <div className="page-not-found">Работа не найдена</div>;
  }

  const canEditWork = isTeacher && isEditMode;

  return (
    <div className="work-page">
      <div className="work-page-header">
        <button type="button" className="back-button" onClick={goBack}>
          ← Назад
        </button>
        {!canEditWork && <h1 className="work-page-title work-page-title-header">{work.title}</h1>}
        {canEditWork && <h1 className="work-page-title work-page-title-header">Редактирование работы</h1>}
        <EntityTimestampsMeta createdAt={work.createdAt} updatedAt={work.updatedAt} />
        {isTeacher && !isEditMode && (
          <div className="work-page-header-actions">
            <button type="button" className="button button-secondary button-small" onClick={() => setIsEditMode(true)}>
              Редактировать
            </button>
            <button
              type="button"
              className="button button-danger button-small"
              onClick={handleDeleteWork}
              disabled={isSubmitting}
            >
              Удалить
            </button>
          </div>
        )}
      </div>

      <div className="work-page-layout">
        <div className="work-files-column">
          <h3>Файлы работы</h3>
          {existingWorkFiles.length > 0 ? (
            <FileList
              files={existingWorkFiles}
              kind="work"
              markedForDelete={deleteWorkFileIds}
              onToggleDelete={canEditWork ? toggleDeleteWorkFile : undefined}
              downloadDisabled={isSubmitting}
            />
          ) : (
            <div className="no-files">Нет файлов</div>
          )}
          {canEditWork && (
            <FileUploadArea
              files={pendingWorkFiles}
              onFilesSelected={(files) =>
                addPendingFiles(
                  files,
                  setPendingWorkFiles,
                  pendingWorkFiles,
                  10 - existingWorkFiles.length + deleteWorkFileIds.length
                )
              }
              onFileDeleted={(id) => setPendingWorkFiles((prev) => prev.filter((f) => f.id !== id))}
              isLoading={isSubmitting}
              maxFiles={10}
            />
          )}
        </div>

        <div className="work-info-column">
          {canEditWork ? (
            <>
              <div className="form-group">
                <label>Название</label>
                <input type="text" value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} rows={4} />
              </div>
              <div className="form-group">
                <label>Срок сдачи</label>
                <input type="date" value={workDeadline} onChange={(e) => setWorkDeadline(e.target.value)} />
              </div>
              <div className="work-form-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleUpdateWork}
                  disabled={isSubmitting}
                >
                  Применить
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setIsEditMode(false);
                    setWorkTitle(work.title);
                    setWorkDescription(work.description ?? '');
                    setWorkDeadline(work.deadline ? work.deadline.substring(0, 10) : '');
                    setDeleteWorkFileIds([]);
                    setPendingWorkFiles([]);
                  }}
                  disabled={isSubmitting}
                >
                  Отмена
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="work-description">
                <p>{work.description || 'Нет описания'}</p>
              </div>
              {work.deadline && (
                <div className="work-deadline">
                  <strong>Срок сдачи:</strong>{' '}
                  {new Date(work.deadline).toLocaleDateString('ru-RU')}
                </div>
              )}
            </>
          )}

          <div className="work-comments">
            <h4>Комментарии</h4>
            {commentsError && <p className="form-error">{commentsError}</p>}
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
          {submitError && <p className="form-error">{submitError}</p>}
        </div>

        <div className="work-sidebar">
          {isTeacher ? (
            <div className="solutions-list">
              <h3>Сдавшие ({work.solutions?.length ?? 0})</h3>
              {work.solutions && work.solutions.length > 0 ? (
                [...work.solutions]
                  .sort((a, b) =>
                    a.studentName.localeCompare(b.studentName, 'ru', { sensitivity: 'base' })
                  )
                  .map((sol) => {
                  const timeliness = getSubmissionTimeliness(work.deadline, sol);
                  return (
                  <button
                    key={sol.id}
                    type="button"
                    className={`solution-item solution-item-button${
                      timeliness === 'on-time' ? ' solution-item-on-time' : ' solution-item-late'
                    }`}
                    onClick={() =>
                      navigate(
                        `/teacher/solution/${sol.id}/${gId}/${sId}/${lId}/${wId}`
                      )
                    }
                  >
                    <div className="solution-student">{sol.studentName}</div>
                    <div className="solution-item-dates">
                      <div className="solution-date">
                        Добавлено: {formatSolutionDateTime(sol.createdAt)}
                      </div>
                      {wasSolutionEdited(sol) && sol.updatedAt && (
                        <div className="solution-date">
                          Изменено: {formatSolutionDateTime(sol.updatedAt)}
                        </div>
                      )}
                    </div>
                  </button>
                  );
                })
              ) : (
                <div className="no-solutions">Пока никто не сдал</div>
              )}
            </div>
          ) : (
            <div className="solution-upload">
              <h3>Моё решение</h3>
              <button
                type="button"
                className="button button-primary button-block"
                onClick={() =>
                  navigate(
                    `/student/solution/${studentSolutionId ?? 'new'}/${wId}/${gId}/${sId}/${lId}`
                  )
                }
              >
                {studentSolutionId ? 'Перейти к решению' : 'Добавить решение'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
