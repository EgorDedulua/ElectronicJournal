import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import AdminCrudPanel from '../components/AdminCrudPanel';
import httpClient from '../api/httpClient';
import { Group, TimetableDay } from '../types';

const sections = ['users', 'groups', 'subjects', 'courses', 'schedule'] as const;

type AdminSection = (typeof sections)[number];

const AdminPage = () => {
  const [section, setSection] = useState<AdminSection>('users');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (section === 'schedule') {
      setLoading(true);
      httpClient.get('/admin/groups')
        .then((response) => setGroups(response.data.data ?? response.data))
        .catch(() => setError('Не удалось загрузить группы'))
        .finally(() => setLoading(false));
    }
  }, [section]);

  useEffect(() => {
    if (section !== 'schedule' || selectedGroup === null) {
      return;
    }

    setLoading(true);
    setError('');
    httpClient.get(`/admin/timetables?id=${selectedGroup}`)
      .then((response) => setTimetable(response.data.data ?? response.data))
      .catch(() => setError('Не удалось загрузить расписание'))
      .finally(() => setLoading(false));
  }, [section, selectedGroup]);

  const sectionLabel = useMemo(() => {
    switch (section) {
      case 'users': return 'Пользователи';
      case 'groups': return 'Группы';
      case 'subjects': return 'Предметы';
      case 'courses': return 'Курсы';
      case 'schedule': return 'Расписание группы';
      default: return 'Админ';
    }
  }, [section]);

  return (
    <div className="page admin-page">
      <Header />
      <div className="page-body page-split">
        <aside className="panel sidebar">
          <h2>Админ-панель</h2>
          {sections.map((item) => (
            <button
              key={item}
              className={`button button-block ${section === item ? 'button-active' : 'button-secondary'}`}
              onClick={() => setSection(item)}
            >
              {item === 'users' ? 'Пользователи' : item === 'groups' ? 'Группы' : item === 'subjects' ? 'Предметы' : item === 'courses' ? 'Курсы' : 'Расписание'}
            </button>
          ))}
        </aside>

        <main className="panel content-panel">
          <div className="page-title">
            <h1>{sectionLabel}</h1>
          </div>
          {section === 'schedule' ? (
            <div className="card schedule-card">
              <div className="form-grid">
                <label>
                  Группа
                  <select value={selectedGroup ?? ''} onChange={(e) => setSelectedGroup(Number(e.target.value) || null)}>
                    <option value="">Выберите группу</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {loading && <p>Загрузка расписания...</p>}
              {error && <p className="form-error">{error}</p>}
              {!loading && selectedGroup !== null && (
                <div className="schedule-grid">
                  {timetable.length === 0 ? (
                    <p>Расписание пустое для выбранной группы.</p>
                  ) : timetable.map((day) => (
                    <div key={day.dayOfWeek} className="schedule-day-card">
                      <div className="schedule-day-title">День {day.dayOfWeek}</div>
                      <ul>
                        {day.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <strong>{lesson.lessonNumber} урок</strong> — {lesson.subjectName} ({lesson.teacherName})<br />
                            {lesson.startTime}–{lesson.endTime}, {lesson.room}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <AdminCrudPanel section={section} />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
