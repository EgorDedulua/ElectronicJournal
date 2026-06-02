import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import httpClient from '../api/httpClient';
import { useAuth } from '../context/AuthContext';
import { dayNames } from '../utils/dayNames';
import { formatTime } from '../utils/formatTime';
import { Subject, TimetableDay, Lesson, MarkRecord, AbsenceRecord, LateRecord, CreditRecord, JournalCell } from '../types';
import JournalTable from '../components/JournalTable';

interface SubjectJournalRow {
  name: string;
  cells: JournalCell[];
  summary?: string;
}
const StudentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [journalDates, setJournalDates] = useState<string[]>([]);
  const [journalRows, setJournalRows] = useState<SubjectJournalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'schedule' | 'journal'>(() => {
    const saved = sessionStorage.getItem('studentActiveTab');
    return saved === 'journal' ? 'journal' : 'schedule';
  });

  useEffect(() => {
    sessionStorage.setItem('studentActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!user?.groupId) return;

    setLoading(true);
    setError('');

    Promise.all([
      httpClient.get(`/student/timetable/${user.groupId}`),
      httpClient.get('/student/subjects')
    ])
      .then(([timetableRes, subjectsRes]) => {
        setTimetable(timetableRes.data.data ?? timetableRes.data);
        setSubjects(subjectsRes.data.data ?? subjectsRes.data);
      })
      .catch(() => setError('Не удалось загрузить расписание или предметы'))
      .finally(() => setLoading(false));
  }, [user?.groupId]);

  useEffect(() => {
    if (!subjects.length) {
      setJournalRows([]);
      setJournalDates([]);
      return;
    }

    const loadJournal = async () => {
      setLoading(true);
      setError('');

      try {
        const subjectRows = await Promise.all(subjects.map(async (subject) => {
          const [lessonsRes, marksRes, absencesRes, latesRes, creditsRes] = await Promise.all([
            httpClient.get(`/student/subjects/${subject.id}/lessons`),
            httpClient.get(`/student/subjects/${subject.id}/marks`),
            httpClient.get(`/student/subjects/${subject.id}/absences`),
            httpClient.get(`/student/subjects/${subject.id}/lates`),
            httpClient.get(`/student/subjects/${subject.id}/credits`)
          ]);

          const lessons: Lesson[] = lessonsRes.data.data ?? lessonsRes.data;
          const marks: MarkRecord[] = marksRes.data.data ?? marksRes.data;
          const absences: AbsenceRecord[] = absencesRes.data.data ?? absencesRes.data;
          const lates: LateRecord[] = latesRes.data.data ?? latesRes.data;
          const credits: CreditRecord[] = creditsRes.data.data ?? creditsRes.data;

          const lessonIdToCell = new Map<number, JournalCell>();
          lessons.forEach((lesson) => {
            lessonIdToCell.set(lesson.id, {
              date: lesson.date.substring(0, 10),
              lessonId: lesson.id,
              lessonType: lesson.type,
              workId: lesson.workId ?? undefined,
              mark: marks.find((item) => item.lessonId === lesson.id)?.mark?.toString(),
              absence: absences.some((item) => item.lessonId === lesson.id),
              lateMinutes: lates.find((item) => item.lessonId === lesson.id)?.minutes,
              credit: credits.some((item) => item.lessonId === lesson.id)
            });
          });

          return { subject, lessons, lessonIdToCell };
        }));

        const allLessons = subjectRows.flatMap((row) => row.lessons);
        const sortedLessons = Array.from(new Map(allLessons.map((lesson) => [lesson.id, lesson])).values())
          .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

        const dates = sortedLessons.map((lesson) => lesson.date.substring(0, 10));

        const alignedRows = subjectRows.map(({ subject, lessonIdToCell }) => {
          const cells = sortedLessons.map((lesson) =>
            lessonIdToCell.get(lesson.id) ?? {
              date: lesson.date.substring(0, 10),
              lessonId: lesson.id
            }
          );

          const markValues = cells
            .map((cell) => Number(cell.mark))
            .filter((value) => !Number.isNaN(value));

          const average = markValues.length
            ? markValues.reduce((sum, value) => sum + value, 0) / markValues.length
            : null;

          return {
            name: subject.name,
            cells,
            summary: average !== null ? average.toFixed(2).replace('.', ',') : '-'
          };
        });

        setJournalDates(dates);
        setJournalRows(alignedRows);
      } catch {
        setError('Не удалось загрузить журнал студента');
      } finally {
        setLoading(false);
      }
    };

    loadJournal();
  }, [subjects]);

  const scheduleContent = useMemo(() => {
    if (loading) return <p>Загрузка...</p>;
    if (!user?.groupId) return <p>Группа не назначена.</p>;
    if (!timetable.length) return <p>Расписание не найдено.</p>;

    return (
      <div className="schedule-grid schedule-columns">
        {timetable.map((day) => (
          <div key={day.dayOfWeek} className="schedule-day-card">
            <div className="schedule-day-title">{dayNames[day.dayOfWeek] ?? `День ${day.dayOfWeek}`}</div>
            <div className="schedule-day-list">
              {day.lessons.map((lesson) => (
                <div key={lesson.id} className="schedule-item">
                  <div className="lesson-number">{lesson.lessonNumber}</div>
                  <div>
                    <div className="lesson-subject">{lesson.subjectName}</div>
                    <div className="lesson-meta">{formatTime(lesson.startTime)} – {formatTime(lesson.endTime)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }, [loading, timetable, user?.groupId]);

  const journalContent = useMemo(() => {
    if (loading) return <p>Загрузка...</p>;
    if (error) return <p className="form-error">{error}</p>;
    if (!journalRows.length) return <p>Журнал пока пуст.</p>;

    const openStudentWork = (_date: string, workId?: number | null, lessonId?: number) => {
      if (!workId || !user?.groupId || !lessonId) return;
      sessionStorage.setItem('studentActiveTab', 'journal');
      const subjectRow = journalRows.find((row) =>
        row.cells.some((cell) => cell.lessonId === lessonId && cell.workId === workId)
      );
      const subject = subjects.find((s) => s.name === subjectRow?.name);
      if (!subject) return;
      navigate(`/student/work/${workId}/${user.groupId}/${subject.id}/${lessonId}`);
    };

    return (
      <div className="journal-section">
        <JournalTable
          header={journalDates}
          rows={journalRows}
          summaryLabel="Средний"
          onHeaderWorkButtonClick={openStudentWork}
          workHeaderMode="view-only"
        />
        <p className="hint-text">Журнал показывает предметы слева и отметки, пропуски, опоздания, зачеты по датам. Наведите на дату с работой для перехода.</p>
      </div>
    );
  }, [journalDates, journalRows, loading, error, navigate, user?.groupId, subjects]);

  return (
    <div className="page student-page">
      <Header>
        <nav className="header-nav-items">
          <button 
            className={`nav-item ${activeTab === 'schedule' ? 'nav-item-active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Расписание
          </button>
          <button 
            className={`nav-item ${activeTab === 'journal' ? 'nav-item-active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            Журнал
          </button>
        </nav>
      </Header>

      <main className="page-body">
        {activeTab === 'schedule' ? (
          <div className="panel content-panel">
            <div className="page-title"><h1>Расписание студента</h1></div>
            {scheduleContent}
          </div>
        ) : (
          <div className="panel content-panel">
            <div className="page-title"><h1>Журнал студента</h1></div>
            {journalContent}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentPage;
