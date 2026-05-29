import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import httpClient from '../api/httpClient';
import { Course, Group, Subject, UserProfile } from '../types';

type Section = 'users' | 'groups' | 'subjects' | 'courses';

interface AdminCrudPanelProps {
  section: Section;
}

const initialUserForm = { login: '', password: '', fullName: '', role: 'student', groupId: '' };
const initialGroupForm = { name: '' };
const initialSubjectForm = { name: '' };
const initialCourseForm = { teacherId: '', groupId: '', subjectId: '' };

const AdminCrudPanel = ({ section }: AdminCrudPanelProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(initialUserForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const sectionLabel = useMemo(() => {
    switch (section) {
      case 'users': return 'Пользователи';
      case 'groups': return 'Группы';
      case 'subjects': return 'Предметы';
      case 'courses': return 'Связи группы-предмет-учитель';
      default: return 'Администрирование';
    }
  }, [section]);

  const listUrl = `/admin/${section}`;

  useEffect(() => {
    setError('');
    setEditId(null);
    setForm(section === 'users' ? initialUserForm : section === 'groups' ? initialGroupForm : section === 'subjects' ? initialSubjectForm : initialCourseForm);
  }, [section]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, teachersRes, groupsRes, subjectsRes] = await Promise.all([
          httpClient.get(listUrl),
          section === 'courses' ? httpClient.get('/admin/users?role=teacher') : Promise.resolve({ data: [] }),
          section === 'courses' || section === 'users' ? httpClient.get('/admin/groups') : Promise.resolve({ data: [] }),
          section === 'courses' ? httpClient.get('/admin/subjects') : Promise.resolve({ data: [] })
        ]);
        setItems(data.data.data ?? data.data);
        setTeachers(teachersRes.data.data ?? teachersRes.data);
        setGroups(groupsRes.data.data ?? groupsRes.data);
        setSubjects(subjectsRes.data.data ?? subjectsRes.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listUrl, section]);

  const handleInput = (field: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((state) => ({ ...state, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form };
      if (section === 'users' && payload.groupId === '') {
        delete payload.groupId;
      }
      if (editId) {
        await httpClient.put(`${listUrl}/${editId}`, payload);
      } else {
        await httpClient.post(listUrl, payload);
      }
      const result = await httpClient.get(listUrl);
      setItems(result.data.data ?? result.data);
      setEditId(null);
      setForm(section === 'users' ? initialUserForm : section === 'groups' ? initialGroupForm : section === 'subjects' ? initialSubjectForm : initialCourseForm);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    if (section === 'users') {
      setForm({
        login: item.login || '',
        password: '',
        fullName: item.fullName || '',
        role: item.role || 'student',
        groupId: item.groupId?.toString() || ''
      });
    } else if (section === 'groups' || section === 'subjects') {
      setForm({ name: item.name || '' });
    } else if (section === 'courses') {
      setForm({
        teacherId: item.teacherId?.toString() || '',
        groupId: item.groupId?.toString() || '',
        subjectId: item.subjectId?.toString() || ''
      });
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      await httpClient.delete(`${listUrl}/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка удаления');
    } finally {
      setLoading(false);
    }
  };

  const renderRow = (item: any) => {
    if (section === 'users') {
      return (
        <tr key={item.id}>
          <td>{item.login}</td>
          <td>{item.fullName}</td>
          <td>{item.role}</td>
          <td>{item.group?.name ?? item.groupName ?? '-'}</td>
          <td>
            <button className="button button-small" onClick={() => handleEdit(item)}>Изменить</button>
            <button className="button button-danger button-small" onClick={() => handleDelete(item.id)}>Удалить</button>
          </td>
        </tr>
      );
    }

    if (section === 'groups' || section === 'subjects') {
      return (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>
            <button className="button button-small" onClick={() => handleEdit(item)}>Изменить</button>
            <button className="button button-danger button-small" onClick={() => handleDelete(item.id)}>Удалить</button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id}>
        <td>{item.subjectName ?? item.subject?.name ?? item.subject?.name}</td>
        <td>{item.groupName ?? item.group?.name ?? item.group?.name}</td>
        <td>{item.teacherName ?? item.teacher?.fullName ?? item.teacher?.fullName}</td>
        <td>
          <button className="button button-small" onClick={() => handleEdit(item)}>Изменить</button>
          <button className="button button-danger button-small" onClick={() => handleDelete(item.id)}>Удалить</button>
        </td>
      </tr>
    );
  };

  return (
    <section className="card admin-panel">
      <div className="card-header">
        <h2>{sectionLabel}</h2>
      </div>
      <div className="card-body">
        <form className="form-grid" onSubmit={handleSubmit}>
          {section === 'users' && (
            <>
              <label>
                Логин
                <input value={form.login} onChange={handleInput('login')} required />
              </label>
              <label>
                Пароль{editId ? ' (оставьте пустым, чтобы не менять)' : ''}
                <input type="password" value={form.password} onChange={handleInput('password')} minLength={6} />
              </label>
              <label>
                ФИО
                <input value={form.fullName} onChange={handleInput('fullName')} required />
              </label>
              <label>
                Роль
                <select value={form.role} onChange={handleInput('role')}>
                  <option value="student">Студент</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="admin">Администратор</option>
                </select>
              </label>
              <label>
                Группа
                <select value={form.groupId} onChange={handleInput('groupId')}>
                  <option value="">Без группы</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {section === 'groups' && (
            <label>
              Название группы
              <input value={form.name} onChange={handleInput('name')} required />
            </label>
          )}
          {section === 'subjects' && (
            <label>
              Название предмета
              <input value={form.name} onChange={handleInput('name')} required />
            </label>
          )}
          {section === 'courses' && (
            <>
              <label>
                Преподаватель
                <select value={form.teacherId} onChange={handleInput('teacherId')} required>
                  <option value="">Выберите преподавателя</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                  ))}
                </select>
              </label>
              <label>
                Группа
                <select value={form.groupId} onChange={handleInput('groupId')} required>
                  <option value="">Выберите группу</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Предмет
                <select value={form.subjectId} onChange={handleInput('subjectId')} required>
                  <option value="">Выберите предмет</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={loading}>
              {editId ? 'Сохранить' : 'Добавить'}
            </button>
            {editId && <button type="button" className="button button-ghost" onClick={() => { setEditId(null); setForm(section === 'users' ? initialUserForm : section === 'groups' ? initialGroupForm : section === 'subjects' ? initialSubjectForm : initialCourseForm); }}>Отменить</button>}
          </div>
          {error && <p className="form-error">{error}</p>}
        </form>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                {section === 'users' && <><th>Логин</th><th>ФИО</th><th>Роль</th><th>Группа</th></>}
                {section === 'groups' && <th>Название</th>}
                {section === 'subjects' && <th>Название</th>}
                {section === 'courses' && <><th>Предмет</th><th>Группа</th><th>Преподаватель</th></>}
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(renderRow)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminCrudPanel;
