import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import httpClient from '../api/httpClient';
import ScheduleGrid from '../components/ScheduleGrid';
import { Group, Student, Subject, TimetableDay, Lesson, MarkRecord, AbsenceRecord, LateRecord, CreditRecord, JournalCell } from '../types';
import { lessonTypeLabels } from '../types/lesson';
import JournalTable from '../components/JournalTable';

interface TeacherJournalCell extends JournalCell {
  lessonId: number;
  markId?: number;
  absenceId?: number;
  lateId?: number;
  creditId?: number;
}

interface TeacherJournalRow {
  name: string;
  studentId: number;
  isExpelled: boolean;
  number: number;
  cells: TeacherJournalCell[];
  summary?: string;
}

interface ActiveTeacherCell {
  row: TeacherJournalRow;
  date: string;
  lesson?: Lesson;
  cell?: TeacherJournalCell;
  mode: 'mark' | 'late';
}

const TeacherPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'schedule' | 'journal'>(() => {
    const saved = sessionStorage.getItem('teacherActiveTab');
    return (saved as 'schedule' | 'journal') || 'schedule';
  });
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('teacherSelectedGroup');
    return saved ? parseInt(saved, 10) : null;
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('teacherSelectedSubject');
    return saved ? parseInt(saved, 10) : null;
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [groupCurator, setGroupCurator] = useState<{ id: number; fullName: string } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [journalDates, setJournalDates] = useState<string[]>([]);
  const [journalRows, setJournalRows] = useState<TeacherJournalRow[]>([]);
  const [activeCell, setActiveCell] = useState<ActiveTeacherCell | null>(null);
  const [markValue, setMarkValue] = useState('');
  const [lateMinutes, setLateMinutes] = useState('');
  const [autoLate, setAutoLate] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonDate, setLessonDate] = useState('');
  const [lessonType, setLessonType] = useState<'usual' | 'lab' | 'practice' | 'test' | 'control'>('usual');
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonModalError, setLessonModalError] = useState('');
  const [lessonModalLoading, setLessonModalLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubject);
  const canEditSubject = selectedSubjectObj?.canEdit !== false;

  useEffect(() => {
    setLoading(true);
    httpClient.get('/teacher/timetable')
      .then((response) => setTimetable(response.data.data ?? response.data))
      .catch(() => setError('Не удалось загрузить расписание'))
      .finally(() => setLoading(false));

    httpClient.get('/teacher/groups')
      .then((response) => setGroups(response.data.data ?? response.data))
      .catch(() => setError('Не удалось загрузить группы'))
      .finally(() => {
        // Restore journal state from sessionStorage if returning from work page
        const savedState = sessionStorage.getItem('journalReturnState');
        if (savedState) {
          try {
            const { groupId, subjectId, activeTab: savedTab } = JSON.parse(savedState);
            setSelectedGroup(groupId);
            setSelectedSubject(subjectId);
            if (savedTab === 'journal') setActiveTab('journal');
            sessionStorage.removeItem('journalReturnState');
          } catch (e) {
            // Ignore parsing errors
          }
        }
      });
  }, []);

  // Save selected group to sessionStorage
  useEffect(() => {
    if (selectedGroup !== null) {
      sessionStorage.setItem('teacherSelectedGroup', selectedGroup.toString());
    }
  }, [selectedGroup]);

  // Save selected subject to sessionStorage
  useEffect(() => {
    if (selectedSubject !== null) {
      sessionStorage.setItem('teacherSelectedSubject', selectedSubject.toString());
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedGroup === null) {
      setSubjects([]);
      setStudents([]);
      setGroupCurator(null);
      setSelectedSubject(null);
      return;
    }

    setLoading(true);
    setError('');
    Promise.all([
      httpClient.get(`/teacher/groups/${selectedGroup}/subjects`),
      httpClient.get(`/teacher/groups/${selectedGroup}/students`)
    ])
      .then(([subjectsRes, studentsRes]) => {
        setSubjects(subjectsRes.data.data ?? subjectsRes.data);

        const studentsData = studentsRes.data.data ?? studentsRes.data;
        if (Array.isArray(studentsData)) {
          setStudents(studentsData);
          setGroupCurator(null);
        } else {
          setStudents(studentsData.students ?? []);
          setGroupCurator(studentsData.curator ?? null);
        }
      })
      .catch(() => setError('Не удалось загрузить предметы или студентов'))
      .finally(() => setLoading(false));
  }, [selectedGroup]);

  const loadTeacherJournal = useCallback(async () => {
    if (selectedGroup === null || selectedSubject === null) {
      setLessons([]);
      setJournalDates([]);
      setJournalRows([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [lessonsRes, marksRes, absencesRes, latesRes, creditsRes] = await Promise.all([
        httpClient.get(`/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons`),
        httpClient.get(`/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/marks`),
        httpClient.get(`/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/absences`),
        httpClient.get(`/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lates`),
        httpClient.get(`/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/credits`)
      ]);

      const lessonsData: Lesson[] = lessonsRes.data.data ?? lessonsRes.data;
      const marks: MarkRecord[] = marksRes.data.data ?? marksRes.data;
      const absences: AbsenceRecord[] = absencesRes.data.data ?? absencesRes.data;
      const lates: LateRecord[] = latesRes.data.data ?? latesRes.data;
      const credits: CreditRecord[] = creditsRes.data.data ?? creditsRes.data;

      const lessonDates = lessonsData.map((lesson) => lesson.date.substring(0, 10));

      const sortedStudents = [...students].sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));

      const rows: TeacherJournalRow[] = sortedStudents.map((student, index) => ({
        name: student.fullName,
        studentId: student.id,
        isExpelled: student.isExpelled ?? false,
        number: index + 1,
        cells: lessonsData.map((lesson) => {
          const cellMark = marks.find((item) => item.lessonId === lesson.id && item.studentId === student.id);
          const cellAbsence = absences.find((item) => item.lessonId === lesson.id && item.studentId === student.id);
          const cellLate = lates.find((item) => item.lessonId === lesson.id && item.studentId === student.id);
          const cellCredit = credits.find((item) => item.lessonId === lesson.id && item.studentId === student.id);

          return {
            date: lesson.date.substring(0, 10),
            lessonId: lesson.id,
            lessonType: lesson.type,
            lessonTopic: lesson.topic,
            mark: cellMark?.mark?.toString(),
            markId: cellMark?.id,
            absence: Boolean(cellAbsence),
            absenceId: cellAbsence?.id,
            lateMinutes: cellLate?.minutes,
            lateId: cellLate?.id,
            credit: Boolean(cellCredit),
            creditId: cellCredit?.id,
            workId: lesson.workId || undefined
          };
        })
      }));

      const rowsWithSummary = rows.map((row) => {
        const markValues = row.cells
          .map((cell) => Number(cell.mark))
          .filter((value) => !Number.isNaN(value));

        const average = markValues.length
          ? markValues.reduce((sum, value) => sum + value, 0) / markValues.length
          : null;

        return {
          ...row,
          summary: average !== null ? average.toFixed(2).replace('.', ',') : '-'
        };
      });

      setLessons(lessonsData);
      setJournalDates(lessonDates);
      setJournalRows(rowsWithSummary);
    } catch {
      setError('Не удалось загрузить данные журнала');
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, selectedSubject, students]);

  useEffect(() => {
    loadTeacherJournal();
  }, [loadTeacherJournal]);

  const openJournalCell = (row: TeacherJournalRow, date: string, cell?: JournalCell) => {
    if (row.isExpelled || !cell || cell.lessonId === undefined) return;
    const lesson = lessons.find((item) => item.id === cell.lessonId);
    if (!lesson) return;
    const typedCell = cell as TeacherJournalCell;
    setActiveCell({ row, date, lesson, cell: typedCell, mode: 'mark' });
    setMarkValue(cell.mark ?? '');
    setLateMinutes(cell.lateMinutes?.toString() ?? '');
    setAutoLate(false);
    setModalError('');
  };

  const openLateCell = (row: TeacherJournalRow, date: string, cell?: JournalCell) => {
    if (row.isExpelled || !cell || cell.lessonId === undefined) return;
    const lesson = lessons.find((item) => item.id === cell.lessonId);
    if (!lesson) return;
    const typedCell = cell as TeacherJournalCell;
    setActiveCell({ row, date, lesson, cell: typedCell, mode: 'late' });
    setMarkValue(cell.mark ?? '');
    setLateMinutes(cell.lateMinutes?.toString() ?? '');
    setAutoLate(false);
    setModalError('');
  };

  const toggleAbsenceCell = async (row: TeacherJournalRow, date: string, cell?: TeacherJournalCell) => {
    if (row.isExpelled || !cell || selectedGroup === null || selectedSubject === null) return;
    setModalLoading(true);
    setModalError('');

    try {
      if (cell.absence) {
        if (!cell.absenceId) {
          throw new Error('Не удалось найти отсутствие для удаления');
        }
        await httpClient.delete(`/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${cell.lessonId}/absences/${cell.absenceId}`);
      } else {
        await httpClient.post(`/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${cell.lessonId}/absences`, {
          studentId: row.studentId
        });
      }
      await loadTeacherJournal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Не удалось изменить отсутствие');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setActiveCell(null);
    setMarkValue('');
    setLateMinutes('');
    setAutoLate(false);
    setModalError('');
  };

  const submitMark = async () => {
    if (!activeCell || !activeCell.lesson) return;
    const value = Number(markValue);
    if (!value || value < 1 || value > 10) {
      setModalError('Введите валидную оценку от 1 до 10');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (activeCell.cell?.markId) {
        await httpClient.patch(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/marks/${activeCell.cell.markId}`,
          { mark: value }
        );
      } else {
        await httpClient.post(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/marks`,
          { studentId: activeCell.row.studentId, mark: value }
        );
      }
      await loadTeacherJournal();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Не удалось сохранить оценку');
    } finally {
      setModalLoading(false);
    }
  };

  const deleteMark = async () => {
    if (!activeCell || !activeCell.lesson || !activeCell.cell?.markId) return;
    setModalLoading(true);
    setModalError('');

    try {
      await httpClient.delete(
        `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/marks/${activeCell.cell.markId}`
      );
      await loadTeacherJournal();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Не удалось удалить оценку');
    } finally {
      setModalLoading(false);
    }
  };

  const submitLate = async () => {
    if (!activeCell || !activeCell.lesson) return;
    const value = Number(lateMinutes);

    if (!autoLate && (!value || value < 1 || value > 45)) {
      setModalError('Введите количество минут от 1 до 45');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      if (activeCell.cell?.lateId) {
        await httpClient.patch(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/lates/${activeCell.cell.lateId}`,
          autoLate ? {} : { minutes: value }
        );
      } else {
        await httpClient.post(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/lates`,
          autoLate ? { studentId: activeCell.row.studentId } : { studentId: activeCell.row.studentId, minutes: value }
        );
      }
      await loadTeacherJournal();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Не удалось сохранить опоздание');
    } finally {
      setModalLoading(false);
    }
  };

  const submitAbsence = async () => {
    if (!activeCell || !activeCell.lesson) return;
    setModalLoading(true);
    setModalError('');

    try {
      if (activeCell.cell?.absence) {
        if (!activeCell.cell.absenceId) throw new Error('Отсутствие не найдено');
        await httpClient.delete(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/absences/${activeCell.cell.absenceId}`
        );
      } else {
        await httpClient.post(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/absences`,
          { studentId: activeCell.row.studentId }
        );
      }
      await loadTeacherJournal();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Не удалось изменить отсутствие');
    } finally {
      setModalLoading(false);
    }
  };

  const toggleCredit = async () => {
    if (!activeCell || !activeCell.lesson) return;
    setModalLoading(true);
    setModalError('');

    try {
      if (activeCell.cell?.credit) {
        if (!activeCell.cell.creditId) {
          throw new Error('Не найден зачет для удаления');
        }
        await httpClient.delete(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/credits/${activeCell.cell.creditId}`
        );
      } else {
        await httpClient.post(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/credits`,
          { studentId: activeCell.row.studentId }
        );
      }
      await loadTeacherJournal();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Не удалось изменить зачет');
    } finally {
      setModalLoading(false);
    }
  };

  const openLessonModal = () => {
    setLessonDate(new Date().toISOString().substring(0, 10));
    setLessonType('usual');
    setLessonTopic('');
    setLessonModalError('');
    setIsLessonModalOpen(true);
  };

  const saveJournalReturnState = () => {
    if (!selectedGroup || !selectedSubject) return;
    sessionStorage.setItem('journalReturnState', JSON.stringify({
      groupId: selectedGroup,
      subjectId: selectedSubject,
      activeTab: 'journal',
    }));
    sessionStorage.setItem('teacherActiveTab', 'journal');
  };

  const handleDeleteLesson = useCallback(
    async (lessonId: number) => {
      if (selectedGroup === null || selectedSubject === null) return;

      const lesson = lessons.find((l) => l.id === lessonId);
      const dateLabel = lesson?.date ? lesson.date.substring(0, 10) : '';

      if (
        !window.confirm(
          `Удалить урок${dateLabel ? ` от ${dateLabel}` : ''}? Будут удалены все отметки, работа, пропуски, опоздания и зачёты по этому уроку.`
        )
      ) {
        return;
      }

      setLoading(true);
      setError('');
      try {
        await httpClient.delete(
          `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${lessonId}`
        );
        await loadTeacherJournal();
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
            : 'Не удалось удалить урок';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [selectedGroup, selectedSubject, lessons, loadTeacherJournal]
  );

  const openWorkPageFromHeader = (_date: string, workId?: number | null, lessonId?: number) => {
    if (!selectedGroup || !selectedSubject) return;

    if (!lessonId) {
      setError('Урок не найден для этой колонки');
      return;
    }

    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      setError('Урок не найден');
      return;
    }

    saveJournalReturnState();

    if (workId) {
      navigate(`/teacher/work/${workId}/${selectedGroup}/${selectedSubject}/${lesson.id}`);
    } else {
      navigate(`/teacher/work/new/${selectedGroup}/${selectedSubject}/${lesson.id}`);
    }
  };

  const closeLessonModal = () => {
    setIsLessonModalOpen(false);
    setLessonDate('');
    setLessonType('usual');
    setLessonTopic('');
    setLessonModalError('');
    setLessonModalLoading(false);
  };

  const submitNewLesson = async () => {
    if (!selectedGroup || !selectedSubject) return;
    if (!lessonDate) {
      setLessonModalError('Укажите дату урока');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    if (lessonDate > today) {
      setLessonModalError('Нельзя создавать урок на будущую дату');
      return;
    }

    if (!lessonTopic.trim()) {
      setLessonModalError('Введите тему урока');
      return;
    }

    setLessonModalLoading(true);
    setLessonModalError('');

    try {
      await httpClient.post(
        `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons`,
        {
          date: lessonDate,
          topic: lessonTopic,
          type: lessonType
        }
      );
      await loadTeacherJournal();
      closeLessonModal();
    } catch (err: any) {
      const responseData = err?.response?.data;
      const serverMessage = typeof responseData?.message === 'string'
        ? responseData.message
        : Array.isArray(responseData?.message)
          ? responseData.message.join(', ')
          : typeof responseData?.errors === 'string'
            ? responseData.errors
            : Array.isArray(responseData?.errors)
              ? responseData.errors.join(', ')
              : undefined;
      setLessonModalError(serverMessage || err?.message || 'Не удалось добавить урок');
    } finally {
      setLessonModalLoading(false);
    }
  };

  const scheduleContent = useMemo(() => {
    if (loading) return <p>Загрузка...</p>;
    if (!timetable.length) return <p>Нет данных расписания.</p>;

    const days = timetable.map((day) => day.dayOfWeek).sort((a, b) => a - b);

    return (
      <ScheduleGrid
        days={days}
        getLessonsForDay={(dayOfWeek) =>
          timetable.find((day) => day.dayOfWeek === dayOfWeek)?.lessons ?? []
        }
        showGroup
        showRoom={false}
      />
    );
  }, [loading, timetable]);

  const journalContent = useMemo(() => {
    if (selectedGroup === null) {
      return <p>Выберите группу для просмотра журнала.</p>;
    }

    if (selectedSubject === null) {
      return <p>Выберите предмет для журнала.</p>;
    }

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p className="form-error">{error}</p>;

    const selectorRow = (
      <div className="selector-row">
        <div className="selector-item">
          <div className="selector-label">Группа</div>
          <div className="selector-value">{groups.find((g) => g.id === selectedGroup)?.name}</div>
        </div>
        <div className="selector-item">
          <div className="selector-label">Предмет</div>
          <div className="selector-value">{subjects.find((s) => s.id === selectedSubject)?.name}</div>
        </div>
        {groupCurator && (
          <div className="selector-item">
            <div className="selector-label">Куратор</div>
            <div className="selector-value">{groupCurator.fullName}</div>
          </div>
        )}
      </div>
    );

    if (!journalRows.length) {
      return (
        <div className="journal-section">
          <div className="selector-toolbar">
            {selectorRow}
            {canEditSubject && (
              <button className="button button-primary button-small selector-action-button" onClick={openLessonModal}>
                Добавить урок
              </button>
            )}
          </div>
          <p>Нет данных для отображения журнала.</p>
        </div>
      );
    }

    return (
      <div className="journal-section">
        <div className="selector-toolbar">
          {selectorRow}
          {canEditSubject && (
            <button className="button button-primary button-small selector-action-button" onClick={openLessonModal}>
              Добавить урок
            </button>
          )}
        </div>
        <JournalTable
          header={journalDates}
          rows={journalRows}
          rowLabel="Студенты"
          summaryLabel="Средний"
          onCellClick={canEditSubject ? openJournalCell : undefined}
          onCellAuxClick={canEditSubject ? (row, date, cell, button) => {
            if (button === 1) openLateCell(row, date, cell);
          } : undefined}
          onCellContextMenu={canEditSubject ? (row, date, cell) => toggleAbsenceCell(row, date, cell as TeacherJournalCell) : undefined}
          onHeaderWorkButtonClick={canEditSubject ? openWorkPageFromHeader : undefined}
          onHeaderDeleteLessonClick={canEditSubject ? handleDeleteLesson : undefined}
        />
        <p className="hint-text">
          Левый клик — оценка, средний клик — опоздание, правый клик — отсутствие.
          {canEditSubject && ' Наведите на дату урока — удаление урока (🗑) или работа (+/→).'}
          {!canEditSubject && ' Редактирование журнала и работ недоступно для этого предмета.'}
        </p>

        {activeCell && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-label">Ученик</div>
                  <div className="modal-title">{activeCell.row.number}. {activeCell.row.name}</div>
                </div>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-subtitle">Дата: {activeCell.date}</p>
                <p className="modal-subtitle">Урок: {activeCell.lesson?.topic ?? '—'}</p>
                {activeCell.lesson?.type && (
                  <p className="modal-subtitle">Тип урока: {lessonTypeLabels[activeCell.lesson.type] ?? 'Урок'}</p>
                )}
                {activeCell?.mode === 'mark' ? (
                  <div className="modal-grid">
                    <div className="modal-card-item">
                            <label>Оценка</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={markValue}
                        onChange={(e) => setMarkValue(e.target.value)}
                        disabled={modalLoading}
                      />
                      <button className="button button-primary button-block" onClick={submitMark} disabled={modalLoading}>Сохранить</button>
                      {activeCell.cell?.markId && (
                        <button className="button button-secondary button-block" onClick={deleteMark} disabled={modalLoading}>Удалить оценку</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="modal-grid">
                    <div className="modal-card-item">
                      <label>Опоздание (мин)</label>
                      <input
                        type="number"
                        min="1"
                        max="45"
                        value={lateMinutes}
                        onChange={(e) => setLateMinutes(e.target.value)}
                        disabled={modalLoading || autoLate}
                      />
                      <div className="checkbox-row">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={autoLate}
                            onChange={(e) => setAutoLate(e.target.checked)}
                            disabled={modalLoading}
                          />
                          <span className="checkbox-text">Автоматический расчёт</span>
                        </label>
                      </div>
                      <button className="button button-secondary button-block" onClick={submitLate} disabled={modalLoading}>Сохранить опоздание</button>
                      {activeCell.cell?.lateId && (
                        <button className="button button-secondary button-block" onClick={async () => {
                          if (!activeCell?.cell?.lateId || !activeCell?.lesson) return;
                          setModalLoading(true);
                          setModalError('');
                          try {
                            await httpClient.delete(
                              `/teacher/groups/${selectedGroup}/subjects/${selectedSubject}/lessons/${activeCell.lesson.id}/lates/${activeCell.cell.lateId}`
                            );
                            await loadTeacherJournal();
                            closeModal();
                          } catch (err: any) {
                            setModalError(err?.response?.data?.message || 'Не удалось удалить опоздание');
                          } finally {
                            setModalLoading(false);
                          }
                        }} disabled={modalLoading}>Удалить опоздание</button>
                      )}
                    </div>
                  </div>
                )}
                <div className="modal-actions">
                      <button
                    className={`button ${activeCell.cell?.absence ? 'button-primary' : 'button-danger'}`}
                    onClick={submitAbsence}
                    disabled={modalLoading}
                  >
                    {activeCell.cell?.absence ? 'Убрать Н' : 'Отметить Н'}
                  </button>
                  {activeCell.lesson?.type === 'lab' || activeCell.lesson?.type === 'practice' ? (
                    <button className="button button-secondary" onClick={toggleCredit} disabled={modalLoading}>
                      {activeCell.cell?.credit ? 'Убрать зачет' : 'Выставить зачет'}
                    </button>
                  ) : null}
                </div>
                {modalError && <p className="form-error">{modalError}</p>}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }, [selectedGroup, selectedSubject, journalDates, journalRows, groups, subjects, groupCurator, loading, error, activeCell, markValue, lateMinutes, autoLate, modalLoading, modalError, isLessonModalOpen, lessonDate, lessonType, lessonTopic, lessonModalError, lessonModalLoading, lessons, canEditSubject, openJournalCell, openLateCell, toggleAbsenceCell, openWorkPageFromHeader, handleDeleteLesson, openLessonModal, closeModal, submitMark, deleteMark, submitLate, submitAbsence, toggleCredit, loadTeacherJournal]);

  return (
    <div className="page teacher-page">
      <Header>
        <nav className="header-nav-items">
          <button 
            className={`nav-item ${activeTab === 'schedule' ? 'nav-item-active' : ''}`}
            onClick={() => {
              setActiveTab('schedule');
              sessionStorage.setItem('teacherActiveTab', 'schedule');
            }}
          >
            Расписание
          </button>
          <button 
            className={`nav-item ${activeTab === 'journal' ? 'nav-item-active' : ''}`}
            onClick={() => {
              setActiveTab('journal');
              sessionStorage.setItem('teacherActiveTab', 'journal');
            }}
          >
            Журнал
          </button>
        </nav>
      </Header>

      <main className="page-body">
        <div className="panel content-panel">
          {activeTab === 'schedule' ? (
            <>
              <div className="page-title"><h1>Расписание преподавателя</h1></div>
              {scheduleContent}
            </>
          ) : (
            <>
              <div className="page-title"><h1>Журнал преподавателя</h1></div>
              <div className="form-grid">
                <label>
                  Группа
                  <select value={selectedGroup ?? ''} onChange={(e) => { setSelectedSubject(null); setSelectedGroup(Number(e.target.value) || null); }}>
                    <option value="">Выберите группу</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}{group.isCurator ? ' (курируемая)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Предмет
                  <select value={selectedSubject ?? ''} onChange={(e) => setSelectedSubject(Number(e.target.value) || null)} disabled={!selectedGroup}>
                    <option value="">Выберите предмет</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}{subject.canEdit === false ? ' (только просмотр)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              {journalContent}
            </>
          )}
        </div>
      </main>

      {/* Lesson Modal - Always rendered, not dependent on journal state */}
      {isLessonModalOpen && (
        <div className="modal-backdrop" onClick={closeLessonModal}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-label">Новый урок</div>
                <div className="modal-title">Добавление урока</div>
              </div>
              <button className="modal-close" onClick={closeLessonModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-card-item">
                <label>Дата урока</label>
                <input
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  disabled={lessonModalLoading}
                />
              </div>
              <div className="modal-card-item">
                <label>Тип урока</label>
                <select value={lessonType} onChange={(e) => setLessonType(e.target.value as any)} disabled={lessonModalLoading}>
                  <option value="usual">Урок</option>
                  <option value="lab">Лабораторная</option>
                  <option value="practice">Практика</option>
                  <option value="test">Тест</option>
                  <option value="control">Контрольная</option>
                </select>
              </div>
              <div className="modal-card-item">
                <label>Тема</label>
                <input
                  type="text"
                  value={lessonTopic}
                  onChange={(e) => setLessonTopic(e.target.value)}
                  disabled={lessonModalLoading}
                />
              </div>
              <div className="modal-actions">
                <button className="button button-primary button-block" onClick={submitNewLesson} disabled={lessonModalLoading}>
                  Добавить урок
                </button>
              </div>
              {lessonModalError && <p className="form-error">{lessonModalError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPage;
