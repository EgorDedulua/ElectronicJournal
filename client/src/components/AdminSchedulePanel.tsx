import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import httpClient from '../api/httpClient';
import {
  createTimetableEntry,
  deleteTimetableEntry,
  getGroupTimetable,
  updateTimetableEntry,
} from '../api/timetableApi';
import ScheduleGrid from './ScheduleGrid';
import { Course, Group, TimetableDay, TimetableLesson } from '../types';
import { dayNames } from '../utils/dayNames';

const WEEK_DAYS = [1, 2, 3, 4, 5, 6] as const;
const MAX_LESSONS_PER_DAY = 8;

const initialLessonForm = {
  lessonNumber: '',
  courseId: '',
  room: '',
};

type LessonModalState =
  | { open: false }
  | {
      open: true;
      mode: 'create' | 'edit';
      dayOfWeek: number;
      editId?: number;
      editDayOfWeek?: number;
    };

function mergeVisibleDays(prev: number[], fromApi: TimetableDay[]): number[] {
  const merged = new Set([...prev, ...fromApi.map((d) => d.dayOfWeek)]);
  return [...merged].sort((a, b) => a - b);
}

function lessonsByDayMap(timetable: TimetableDay[]): Map<number, TimetableLesson[]> {
  const map = new Map<number, TimetableLesson[]>();
  for (const day of timetable) {
    map.set(day.dayOfWeek, day.lessons);
  }
  return map;
}

const AdminSchedulePanel = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [visibleDays, setVisibleDays] = useState<number[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [addDayOpen, setAddDayOpen] = useState(false);
  const [addDaySelection, setAddDaySelection] = useState('');

  const [lessonModal, setLessonModal] = useState<LessonModalState>({ open: false });
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await httpClient.get('/admin/groups');
      setGroups(response.data.data ?? response.data);
    } catch {
      setError('Не удалось загрузить группы');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTimetable = useCallback(async (groupId: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await getGroupTimetable(groupId);
      setTimetable(data);
      setVisibleDays((prev) => mergeVisibleDays(prev, data));
    } catch {
      setError('Не удалось загрузить расписание');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async (groupId: number) => {
    try {
      const response = await httpClient.get('/admin/courses', {
        params: { groupIds: [groupId], pageSize: 200 },
      });
      setCourses(response.data.data ?? response.data ?? []);
    } catch {
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedGroup === null) {
      setTimetable([]);
      setVisibleDays([]);
      setCourses([]);
      setAddDayOpen(false);
      setLessonModal({ open: false });
      return;
    }

    setVisibleDays([]);
    setTimetable([]);
    setAddDayOpen(false);
    setLessonModal({ open: false });
    loadTimetable(selectedGroup);
    loadCourses(selectedGroup);
  }, [selectedGroup, loadTimetable, loadCourses]);

  const lessonsMap = useMemo(() => lessonsByDayMap(timetable), [timetable]);

  const availableDaysToAdd = useMemo(
    () => WEEK_DAYS.filter((d) => !visibleDays.includes(d)),
    [visibleDays]
  );

  const getLessonsForDay = (dayOfWeek: number): TimetableLesson[] => {
    return lessonsMap.get(dayOfWeek) ?? [];
  };

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value ? Number(value) : null);
  };

  const openAddDayModal = () => {
    setAddDaySelection(availableDaysToAdd[0]?.toString() ?? '');
    setAddDayOpen(true);
  };

  const handleAddDay = () => {
    const day = Number(addDaySelection);
    if (!WEEK_DAYS.includes(day as (typeof WEEK_DAYS)[number])) return;
    if (visibleDays.includes(day)) return;
    setVisibleDays((prev) => [...prev, day].sort((a, b) => a - b));
    setAddDayOpen(false);
  };

  const openCreateLesson = (dayOfWeek: number) => {
    setLessonForm(initialLessonForm);
    setModalError('');
    setLessonModal({ open: true, mode: 'create', dayOfWeek });
  };

  const openEditLesson = (lesson: TimetableLesson, dayOfWeek: number) => {
    setLessonForm({
      lessonNumber: String(lesson.lessonNumber),
      courseId: String(lesson.courseId),
      room: lesson.room ?? '',
    });
    setModalError('');
    setLessonModal({
      open: true,
      mode: 'edit',
      dayOfWeek,
      editId: lesson.id,
      editDayOfWeek: dayOfWeek,
    });
  };

  const closeLessonModal = () => {
    setLessonModal({ open: false });
    setModalError('');
    setLessonForm(initialLessonForm);
  };

  const validateLessonForm = (): string | null => {
    if (!lessonModal.open) return 'Ошибка формы';

    const lessonNumber = Number(lessonForm.lessonNumber);
    const courseId = Number(lessonForm.courseId);
    const room = lessonForm.room.trim();
    const dayOfWeek =
      lessonModal.mode === 'edit' && lessonModal.editDayOfWeek != null
        ? lessonModal.editDayOfWeek
        : lessonModal.dayOfWeek;

    if (!lessonForm.lessonNumber || Number.isNaN(lessonNumber)) {
      return 'Укажите номер урока';
    }
    if (lessonNumber < 1 || lessonNumber > 13) {
      return 'Номер урока должен быть от 1 до 13';
    }
    if (!courseId) {
      return 'Выберите предмет';
    }
    if (!room) {
      return 'Укажите кабинет';
    }
    if (room.length > 50) {
      return 'Кабинет не может быть длиннее 50 символов';
    }

    const dayLessons = getLessonsForDay(dayOfWeek);

    if (lessonModal.mode === 'create' && dayLessons.length >= MAX_LESSONS_PER_DAY) {
      return `В этот день уже ${MAX_LESSONS_PER_DAY} уроков — больше добавить нельзя`;
    }

    const duplicate = dayLessons.some(
      (l) =>
        l.lessonNumber === lessonNumber &&
        (lessonModal.mode !== 'edit' || l.id !== lessonModal.editId)
    );
    if (duplicate) {
      return 'Урок с таким номером уже есть в этот день';
    }

    return null;
  };

  const handleLessonSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lessonModal.open || selectedGroup === null) return;

    const validationError = validateLessonForm();
    if (validationError) {
      setModalError(validationError);
      return;
    }

    const dayOfWeek =
      lessonModal.mode === 'edit' && lessonModal.editDayOfWeek != null
        ? lessonModal.editDayOfWeek
        : lessonModal.dayOfWeek;

    const dto = {
      courseId: Number(lessonForm.courseId),
      dayOfWeek,
      room: lessonForm.room.trim(),
      lessonNumber: Number(lessonForm.lessonNumber),
    };

    setModalSubmitting(true);
    setModalError('');
    try {
      if (lessonModal.mode === 'create') {
        await createTimetableEntry(dto);
      } else if (lessonModal.editId != null) {
        await updateTimetableEntry(lessonModal.editId, dto);
      }
      closeLessonModal();
      await loadTimetable(selectedGroup);
      setVisibleDays((prev) => mergeVisibleDays(prev, [{ dayOfWeek, lessons: [] }]));
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Ошибка сохранения';
      setModalError(message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (selectedGroup === null) return;
    setLoading(true);
    setError('');
    try {
      await deleteTimetableEntry(lessonId);
      await loadTimetable(selectedGroup);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Ошибка удаления';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const lessonModalDayLabel =
    lessonModal.open && dayNames[lessonModal.dayOfWeek]
      ? dayNames[lessonModal.dayOfWeek]
      : '';

  return (
    <div className="card schedule-card">
      <div className="form-grid">
        <label>
          Группа
          <select value={selectedGroup ?? ''} onChange={(e) => handleGroupChange(e.target.value)}>
            <option value="">Выберите группу</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p>Загрузка...</p>}
      {error && <p className="form-error">{error}</p>}

      {selectedGroup !== null && !loading && (
        <>
          <div className="schedule-toolbar">
            <button
              type="button"
              className="button button-primary"
              onClick={openAddDayModal}
              disabled={availableDaysToAdd.length === 0}
            >
              Добавить день недели
            </button>
          </div>

          {visibleDays.length === 0 ? (
            <p className="schedule-hint">Добавьте день недели, чтобы начать заполнять расписание.</p>
          ) : (
            <ScheduleGrid
              days={visibleDays}
              getLessonsForDay={getLessonsForDay}
              showTeacher
              showRoom
              renderLessonActions={(lesson, dayOfWeek) => (
                <>
                  <button
                    type="button"
                    className="button button-secondary button-small schedule-icon-button"
                    aria-label="Изменить"
                    title="Изменить"
                    onClick={() => openEditLesson(lesson, dayOfWeek)}
                  >
                    ✏
                  </button>
                  <button
                    type="button"
                    className="button button-danger button-small schedule-icon-button"
                    aria-label="Удалить"
                    title="Удалить"
                    onClick={() => handleDeleteLesson(lesson.id)}
                  >
                    🗑
                  </button>
                </>
              )}
              renderDayFooter={(dayOfWeek, lessonCount) => {
                const atMaxLessons = lessonCount >= MAX_LESSONS_PER_DAY;
                return (
                  <button
                    type="button"
                    className="schedule-add-card"
                    onClick={() => openCreateLesson(dayOfWeek)}
                    disabled={atMaxLessons}
                    title={
                      atMaxLessons
                        ? `Максимум ${MAX_LESSONS_PER_DAY} уроков в день`
                        : 'Добавить урок'
                    }
                  >
                    +
                  </button>
                );
              }}
            />
          )}
        </>
      )}

      {addDayOpen && (
        <div className="modal-backdrop" onClick={() => setAddDayOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-label">Расписание</div>
                <div className="modal-title">Добавить день недели</div>
              </div>
              <button type="button" className="modal-close" onClick={() => setAddDayOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form
                className="modal-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddDay();
                }}
              >
                <label>
                  День недели
                  <select
                    value={addDaySelection}
                    onChange={(e) => setAddDaySelection(e.target.value)}
                  >
                    {availableDaysToAdd.map((day) => (
                      <option key={day} value={day}>
                        {dayNames[day]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="modal-actions">
                  <button
                    type="submit"
                    className="button button-primary button-block"
                    disabled={!addDaySelection}
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    onClick={() => setAddDayOpen(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {lessonModal.open && (
        <div className="modal-backdrop" onClick={closeLessonModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-label">Расписание</div>
                <div className="modal-title">
                  {lessonModal.mode === 'create'
                    ? `Добавить урок — ${lessonModalDayLabel}`
                    : `Изменить урок — ${lessonModalDayLabel}`}
                </div>
              </div>
              <button type="button" className="modal-close" onClick={closeLessonModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="modal-form" onSubmit={handleLessonSubmit}>
                <label>
                  Номер урока
                  <input
                    type="number"
                    min={1}
                    max={13}
                    value={lessonForm.lessonNumber}
                    onChange={(e) =>
                      setLessonForm((f) => ({ ...f, lessonNumber: e.target.value }))
                    }
                    disabled={modalSubmitting}
                  />
                </label>
                <label>
                  Предмет
                  <select
                    value={lessonForm.courseId}
                    onChange={(e) =>
                      setLessonForm((f) => ({ ...f, courseId: e.target.value }))
                    }
                    disabled={modalSubmitting || courses.length === 0}
                  >
                    <option value="">Выберите предмет</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.subjectName}
                        {course.teacherName ? ` (${course.teacherName})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {courses.length === 0 && (
                  <p className="form-error">Для группы нет курсов. Создайте курс в разделе «Курсы».</p>
                )}
                <label>
                  Кабинет
                  <input
                    type="text"
                    maxLength={50}
                    value={lessonForm.room}
                    onChange={(e) => setLessonForm((f) => ({ ...f, room: e.target.value }))}
                    disabled={modalSubmitting}
                  />
                </label>
                <div className="modal-actions">
                  <button
                    type="submit"
                    className="button button-primary button-block"
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting
                      ? 'Сохранение...'
                      : lessonModal.mode === 'create'
                        ? 'Создать'
                        : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary button-block"
                    onClick={closeLessonModal}
                    disabled={modalSubmitting}
                  >
                    Отмена
                  </button>
                </div>
                {modalError && <p className="form-error">{modalError}</p>}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedulePanel;
