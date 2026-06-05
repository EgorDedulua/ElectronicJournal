import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  children?: ReactNode;
}

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  teacher: 'Преподаватель',
  student: 'Студент'
};

const Header = ({ children }: HeaderProps) => {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-title">Электронный журнал</div>
      </div>
      
      <div className="header-nav">{children}</div>
      
      {user && (
        <div className="user-panel">
          <div>
            <div>{user.fullName} — {roleLabels[user.role] || user.role}</div>
            {user.groupId && user.role === 'teacher' && (
              <div className="user-group-label">Куратор группы {user.groupName ?? user.groupId}</div>
            )}
            {user.groupId && user.role === 'student' && (
              <div className="user-group-label">
                Студент группы {user.groupName ?? user.groupId}{user.isExpelled ? ' (отчислен)' : ''}
              </div>
            )}
          </div>
          <button className="button button-ghost button-small" onClick={logout}>
            Выйти
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
