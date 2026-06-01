import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkData, SolutionData, CommentWithReplies } from '../types';
import { FileUploadArea } from '../components/FileUploadArea';

interface WorkPageProps {
  isTeacher?: boolean;
}

interface WorkFormData {
  title: string;
  description: string;
  deadline: string;
  files: File[];
}

export const WorkPage: React.FC<WorkPageProps> = ({ isTeacher = false }) => {
  const { groupId, subjectId, lessonId, workId } = useParams<{
    groupId?: string;
    subjectId?: string;
    lessonId?: string;
    workId?: string;
  }>();

  const navigate = useNavigate();

  const [work, setWork] = useState<WorkData | null>(null);
  const [solutions, setSolutions] = useState<SolutionData[]>([]);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for creating new work
  const [formData, setFormData] = useState<WorkFormData>({
    title: '',
    description: '',
    deadline: '',
    files: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadWork = async () => {
      try {
        setIsLoading(true);
        // If creating new work (no workId or workId='new'), don't fetch
        if (!workId || workId === 'new') {
          setWork(null);
          setError(null);
          return;
        }
        
        // TODO: Fetch work data from API for existing work
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load work');
      } finally {
        setIsLoading(false);
      }
    };

    loadWork();
  }, [groupId, subjectId, lessonId, workId, isTeacher]);

  const goBack = () => {
    // If teacher viewing journal, go back to journal with selected group/subject
    if (isTeacher && groupId && subjectId) {
      navigate(`/teacher?group=${groupId}&subject=${subjectId}`);
    } else {
      navigate(-1);
    }
  };

  const handleSaveWork = async () => {
    if (!formData.title.trim()) {
      setError('Укажите название работы');
      return;
    }

    if (!groupId || !subjectId || !lessonId) {
      setError('Отсутствуют необходимые параметры');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // TODO: Send work creation request to API
      // await httpClient.post(
      //   `/teacher/groups/${groupId}/subjects/${subjectId}/lessons/${lessonId}/works`,
      //   {
      //     title: formData.title,
      //     description: formData.description,
      //     deadline: formData.deadline || null
      //   }
      // );
      console.log('Saving work:', formData);
      // After successful save, go back
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении работы');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="page-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="page-error">{error}</div>;
  }

  // If creating new work (no workId)
  if (!workId || workId === 'new') {
    return (
      <div className="work-page">
        <div className="work-page-header">
          <button className="back-button" onClick={goBack}>
            ← Назад
          </button>
          <h1>Добавить новую работу</h1>
        </div>

        <div className="work-page-layout">
          <div className="work-files-column">
            <h3>Загрузить файлы</h3>
            <FileUploadArea 
              files={[]}
              isLoading={isSaving}
              maxFiles={10}
              onFilesSelected={(files) => {
                setFormData(prev => ({
                  ...prev,
                  files: Array.from(files)
                }));
              }}
            />
          </div>

          <div className="work-info-column">
            <form className="work-form" onSubmit={(e) => {
              e.preventDefault();
              handleSaveWork();
            }}>
              <div className="form-group">
                <label htmlFor="work-title">Название работы *</label>
                <input
                  id="work-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Введите название работы"
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="work-description">Описание</label>
                <textarea
                  id="work-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Опишите требования к работе..."
                  rows={5}
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="work-deadline">Дедлайн</label>
                <input
                  id="work-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  disabled={isSaving}
                />
              </div>

              {error && <div className="form-error">{error}</div>}

              <button 
                type="submit" 
                className="button button-primary button-block"
                disabled={isSaving}
              >
                {isSaving ? 'Сохранение...' : 'Создать работу'}
              </button>
            </form>
          </div>

          <div className="work-sidebar">
            <h3>Предпросмотр</h3>
            <div className="preview-card">
              <div className="preview-section">
                <strong>Название:</strong>
                <p>{formData.title || '—'}</p>
              </div>
              <div className="preview-section">
                <strong>Описание:</strong>
                <p style={{ whiteSpace: 'pre-wrap' }}>{formData.description || '—'}</p>
              </div>
              {formData.deadline && (
                <div className="preview-section">
                  <strong>Дедлайн:</strong>
                  <p>{new Date(formData.deadline).toLocaleDateString('ru-RU')}</p>
                </div>
              )}
              <div className="preview-section">
                <strong>Файлы:</strong>
                <p>{formData.files.length} файл(ов)</p>
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

  return (
    <div className="work-page">
      <div className="work-page-header">
        <button className="back-button" onClick={goBack}>
          ← Назад
        </button>
        <h1>{work.title}</h1>
      </div>

      <div className="work-page-layout">
        {/* Left column: Work files */}
        <div className="work-files-column">
          <h3>Файлы работы</h3>
          {work.files && work.files.length > 0 ? (
            <div className="file-list">
              {work.files.map((file) => (
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

        {/* Middle column: Work info and comments */}
        <div className="work-info-column">
          <div className="work-description">
            <h4>Описание</h4>
            <p>{work.description || 'Нет описания'}</p>
          </div>

          {work.deadline && (
            <div className="work-deadline">
              <strong>Срок сдачи:</strong> {new Date(work.deadline).toLocaleString('ru-RU')}
            </div>
          )}

          <div className="work-comments">
            <h4>Комментарии</h4>
            {/* TODO: Render CommentThread component here */}
          </div>
        </div>

        {/* Right column: Solutions (teacher) or submission form (student) */}
        <div className="work-sidebar">
          {isTeacher ? (
            <div className="solutions-list">
              <h3>Решения студентов ({solutions.length})</h3>
              {solutions.length > 0 ? (
                solutions.map((solution) => (
                  <div
                    key={solution.id}
                    className="solution-item"
                    onClick={() => navigate(`/teacher/solution/${solution.id}`)}
                  >
                    <div className="solution-student">{solution.student?.fullName}</div>
                    <div className="solution-date">
                      {new Date(solution.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-solutions">Нет решений</div>
              )}
            </div>
          ) : (
            <div className="solution-upload">
              <h3>Мое решение</h3>
              {/* TODO: Render file upload form here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
