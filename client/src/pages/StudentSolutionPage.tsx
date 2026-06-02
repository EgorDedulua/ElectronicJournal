import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileUploadArea } from '../components/FileUploadArea';
import { CommentThread } from '../components/CommentThread';
import { useComments } from '../hooks/useComments';
import { useAuth } from '../context/AuthContext';
import { SolutionData, SolutionFile } from '../types/solution';
import { WorkData } from '../types/work';
import {
  createSolution,
  deleteSolution,
  getStudentSolution,
  getStudentWork,
  updateSolution,
} from '../api/worksApi';
import EntityTimestampsMeta from '../components/EntityTimestampsMeta';
import SolutionSubmissionMeta from '../components/SolutionSubmissionMeta';
import { getApiErrorMessage, logApiError } from '../utils/apiError';

interface PendingFile {
  id: number;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  file?: File;
}

export const StudentSolutionPage: React.FC = () => {
  const { solutionId, workId, groupId, subjectId, lessonId } = useParams<{
    solutionId: string;
    workId: string;
    groupId: string;
    subjectId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const solId = solutionId && solutionId !== 'new' ? Number(solutionId) : null;
  const wId = Number(workId);
  const gId = Number(groupId);
  const sId = Number(subjectId);
  const lId = Number(lessonId);

  const [work, setWork] = useState<WorkData | null>(null);
  const [solution, setSolution] = useState<SolutionData | null>(null);
  const [existingSolutionFiles, setExistingSolutionFiles] = useState<SolutionFile[]>([]);
  const [pendingSolutionFiles, setPendingSolutionFiles] = useState<PendingFile[]>([]);
  const [deleteSolutionFileIds, setDeleteSolutionFileIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  const commentScope = useMemo(() => {
    if (!solution?.id) return null;
    return {
      groupId: gId,
      subjectId: sId,
      lessonId: lId,
      workId: wId,
      solutionId: solution.id,
      isTeacher: false,
    };
  }, [solution?.id, gId, sId, lId, wId]);

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

  useEffect(() => {
    const load = async () => {
      if (!wId || !sId || !lId) {
        setError('Неверные параметры');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const loadedWork = await getStudentWork(sId, lId, wId);
        setWork(loadedWork);

        const finalSolutionId = solId ?? loadedWork.solutionId ?? null;
        if (finalSolutionId) {
          const loadedSolution = await getStudentSolution(sId, lId, wId, finalSolutionId);
          setSolution(loadedSolution);
          setExistingSolutionFiles(loadedSolution.files ?? []);
        }
        setError(null);
      } catch (err: unknown) {
        logApiError('loadStudentSolutionPage', err);
        setError(getApiErrorMessage(err, 'Не удалось загрузить данные решения'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [solId, wId, sId, lId]);

  const goBack = () => {
    navigate(`/student/work/${wId}/${gId}/${sId}/${lId}`, { replace: true });
  };

  const addPendingFiles = (
    fileList: FileList,
    setter: React.Dispatch<React.SetStateAction<PendingFile[]>>,
    current: PendingFile[],
    max: number
  ) => {
    const remaining = max - current.length;
    const toAdd = Array.from(fileList).slice(0, remaining);
    const mapped = toAdd.map((file, index) => ({
      id: Date.now() + index,
      originalName: file.name,
      size: file.size,
      mimetype: file.type,
      uploadedAt: new Date().toISOString(),
      file,
    }));
    setter([...current, ...mapped]);
  };

  const toggleDeleteSolutionFile = (id: number) => {
    setDeleteSolutionFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateSolution = async () => {
    const files = pendingSolutionFiles.map((f) => f.file!).filter(Boolean);
    if (!files.length) {
      setSubmitError('Прикрепите хотя бы один файл');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const created = await createSolution(sId, lId, wId, files);
      setSolution(created);
      setExistingSolutionFiles(created.files ?? []);
      setPendingSolutionFiles([]);
    } catch (err: unknown) {
      logApiError('createStudentSolution', err);
      setSubmitError(getApiErrorMessage(err, 'Не удалось отправить решение'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSolution = async () => {
    if (!solution) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const updated = await updateSolution(
        sId,
        lId,
        wId,
        solution.id,
        pendingSolutionFiles.map((f) => f.file!).filter(Boolean),
        deleteSolutionFileIds.length ? deleteSolutionFileIds : undefined
      );
      setSolution(updated);
      setExistingSolutionFiles(updated.files ?? []);
      setPendingSolutionFiles([]);
      setDeleteSolutionFileIds([]);
    } catch (err: unknown) {
      logApiError('updateStudentSolution', err);
      setSubmitError(getApiErrorMessage(err, 'Не удалось обновить решение'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSolution = async () => {
    if (!solution) return;
    if (!window.confirm('Удалить решение?')) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await deleteSolution(sId, lId, wId, solution.id);
      navigate(`/student/work/${wId}/${gId}/${sId}/${lId}`, { replace: true });
    } catch (err: unknown) {
      logApiError('deleteStudentSolution', err);
      setSubmitError(getApiErrorMessage(err, 'Не удалось удалить решение'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFileList = (
    files: { id: number; originalName: string }[],
    markedForDelete: number[],
    onToggleDelete?: (id: number) => void
  ) => (
    <ul className="file-list">
      {files.map((file) => (
        <li
          key={file.id}
          className={`file-item ${markedForDelete.includes(file.id) ? 'file-item-marked-delete' : ''}`}
        >
          <span className="file-item-name">{file.originalName}</span>
          {onToggleDelete && (
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => onToggleDelete(file.id)}
            >
              {markedForDelete.includes(file.id) ? 'Отменить' : 'Открепить'}
            </button>
          )}
        </li>
      ))}
    </ul>
  );

  if (isLoading) {
    return <div className="page-loading">Загрузка...</div>;
  }

  if (!work) {
    return <div className="page-not-found">Работа не найдена</div>;
  }

  return (
    <div className="work-page student-solution-page">
      <div className="work-page-header solution-page-header">
        <button type="button" className="back-button" onClick={goBack}>
          ← К работе
        </button>
        <h1>Моё решение</h1>
        {solution && (
          <SolutionSubmissionMeta solution={solution} deadline={work.deadline} />
        )}
      </div>

      <div className="work-page-layout">
        <div className="work-files-column">
          <h3>Файлы решения</h3>
          {!solution ? (
            <>
              <FileUploadArea
                files={pendingSolutionFiles}
                onFilesSelected={(files) =>
                  addPendingFiles(files, setPendingSolutionFiles, pendingSolutionFiles, 10)
                }
                onFileDeleted={(id) =>
                  setPendingSolutionFiles((prev) => prev.filter((f) => f.id !== id))
                }
                isLoading={isSubmitting}
                maxFiles={10}
              />
              <button
                type="button"
                className="button button-primary button-block solution-upload-submit"
                onClick={handleCreateSolution}
                disabled={isSubmitting}
              >
                Добавить решение
              </button>
            </>
          ) : (
            <>
              {existingSolutionFiles.length > 0
                ? renderFileList(existingSolutionFiles, deleteSolutionFileIds, toggleDeleteSolutionFile)
                : <div className="no-files">Нет файлов</div>}
              <FileUploadArea
                files={pendingSolutionFiles}
                onFilesSelected={(files) =>
                  addPendingFiles(
                    files,
                    setPendingSolutionFiles,
                    pendingSolutionFiles,
                    10 - existingSolutionFiles.length + deleteSolutionFileIds.length
                  )
                }
                onFileDeleted={(id) =>
                  setPendingSolutionFiles((prev) => prev.filter((f) => f.id !== id))
                }
                isLoading={isSubmitting}
                maxFiles={10}
              />
              <div className="work-form-actions">
                <button
                  type="button"
                  className="button button-primary button-block"
                  onClick={handleUpdateSolution}
                  disabled={isSubmitting}
                >
                  Применить
                </button>
                <button
                  type="button"
                  className="button button-danger button-block"
                  onClick={handleDeleteSolution}
                  disabled={isSubmitting}
                >
                  Удалить решение
                </button>
              </div>
            </>
          )}
          {submitError && <p className="form-error">{submitError}</p>}
        </div>

        <div className="work-info-column">
          <h1 className="work-page-title">{work.title}</h1>
          <EntityTimestampsMeta
            createdAt={work.createdAt}
            updatedAt={work.updatedAt}
            createdLabel="Работа создана"
            updatedLabel="Работа изменена"
          />
          <div className="work-description">
            <p>{work.description || 'Нет описания'}</p>
          </div>
          {work.deadline && (
            <div className="work-deadline">
              <strong>Срок сдачи:</strong> {new Date(work.deadline).toLocaleDateString('ru-RU')}
            </div>
          )}

          <div className="work-comments">
            <h4>Приватные комментарии</h4>
            {!solution ? (
              <p className="hint-text">Комментарии будут доступны после отправки решения.</p>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

