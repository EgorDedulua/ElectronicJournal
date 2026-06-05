import { useMemo, useState } from 'react';
import Header from '../components/Header';
import AdminCrudPanel from '../components/AdminCrudPanel';
import AdminSchedulePanel from '../components/AdminSchedulePanel';

const sections = ['users', 'groups', 'subjects', 'courses', 'schedule'] as const;

type AdminSection = (typeof sections)[number];

const AdminPage = () => {
  const [section, setSection] = useState<AdminSection>('users');

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
            <AdminSchedulePanel />
          ) : (
            <AdminCrudPanel section={section} />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
