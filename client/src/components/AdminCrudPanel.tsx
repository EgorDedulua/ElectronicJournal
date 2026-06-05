import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import httpClient from '../api/httpClient';
import { Group, Subject, UserProfile } from '../types';

type Section = 'users' | 'groups' | 'subjects' | 'courses';

interface AdminCrudPanelProps {
  section: Section;
}

const initialUserForm = { login: '', password: '', fullName: '', role: 'student', groupId: '', isExpelled: false };
const initialGroupForm = { name: '' };
const initialSubjectForm = { name: '' };
const initialCourseForm = { teacherId: '', groupId: '', subjectId: '' };
const initialFilters = { role: '', groupId: '', subjectId: '' };

const AdminCrudPanel = ({ section }: AdminCrudPanelProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total?: number } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(initialUserForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [sort, setSort] = useState<'ASC' | 'DESC'>('DESC');
  const [filters, setFilters] = useState(initialFilters);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

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
  const isUsers = section === 'users';
  const isGroups = section === 'groups';
  const isSubjects = section === 'subjects';
  const isCourses = section === 'courses';

  useEffect(() => {
    setError('');
    setEditId(null);
    setIsModalOpen(false);
    setModalError('');
    setSearchInput('');
    setSearchValue('');
    setSort('DESC');
    setFilters(initialFilters);
    setForm(section === 'users' ? initialUserForm : section === 'groups' ? initialGroupForm : section === 'subjects' ? initialSubjectForm : initialCourseForm);
  }, [section]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = { sort };
        if (searchValue.trim()) {
          params.searchString = searchValue;
        }
        if (isUsers && filters.role) params.role = filters.role;
        if ((isUsers || isSubjects || isCourses) && filters.groupId) params.groupIds = [Number(filters.groupId)];
        if (isCourses && filters.subjectId) {
          params.subjectIds = [Number(filters.subjectId)];
          params.subjectds = [Number(filters.subjectId)];
        }

        const [data, teachersRes, groupsRes, subjectsRes] = await Promise.all([
          httpClient.get(listUrl, { params }),
          isCourses ? httpClient.get('/admin/users', { params: { role: 'teacher' } }) : Promise.resolve({ data: [] }),
          isCourses || isUsers || isSubjects ? httpClient.get('/admin/groups') : Promise.resolve({ data: [] }),
          isCourses ? httpClient.get('/admin/subjects') : Promise.resolve({ data: [] })
        ]);
        setItems(data.data.data ?? data.data ?? []);
        setMeta(data.data.meta ?? null);
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
  }, [filters.groupId, filters.role, filters.subjectId, isCourses, isSubjects, isUsers, listUrl, searchValue, section, sort]);

  const handleInput = (field: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((state) => ({ ...state, [field]: event.target.value }));
  };

  const validateForm = () => {
    if (isUsers) {
      if (!form.login.trim() || form.login.trim().length < 4) return 'Логин должен быть не короче 4 символов';
      if (!form.fullName.trim() || form.fullName.trim().length < 2) return 'Введите ФИО (минимум 2 символа)';
      if (modalMode === 'create' && form.role === 'admin') return 'Создание администратора через эту форму недоступно';
      if (modalMode === 'create' && (!form.password || form.password.length < 6)) return 'Пароль должен быть не короче 6 символов';
      if (modalMode === 'edit' && form.password && form.password.length < 6) return 'Новый пароль должен быть не короче 6 символов';
      return '';
    }
    if (isGroups) return form.name.trim().length >= 3 ? '' : 'Название группы должно содержать минимум 3 символа';
    if (isSubjects) return form.name.trim().length >= 2 ? '' : 'Название предмета должно содержать минимум 2 символа';
    if (isCourses) {
      if (!form.teacherId) return 'Выберите преподавателя';
      if (!form.groupId) return 'Выберите группу';
      if (!form.subjectId) return 'Выберите предмет';
    }
    return '';
  };

  const loadItems = async () => {
    const params: Record<string, any> = { sort };
    if (searchValue.trim()) {
      params.searchString = searchValue;
    }
    if (isUsers && filters.role) params.role = filters.role;
    if ((isUsers || isSubjects || isCourses) && filters.groupId) params.groupIds = [Number(filters.groupId)];
    if (isCourses && filters.subjectId) {
      params.subjectIds = [Number(filters.subjectId)];
      params.subjectds = [Number(filters.subjectId)];
    }
    const result = await httpClient.get(listUrl, { params });
    setItems(result.data.data ?? result.data ?? []);
    setMeta(result.data.meta ?? null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalError('');
    setEditId(null);
    setForm(isUsers ? initialUserForm : isGroups ? initialGroupForm : isSubjects ? initialSubjectForm : initialCourseForm);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditId(null);
    setModalError('');
    setForm(isUsers ? initialUserForm : isGroups ? initialGroupForm : isSubjects ? initialSubjectForm : initialCourseForm);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setModalError(validationError);
      return;
    }
    setModalSubmitting(true);
    setModalError('');
    try {
      const payload: any = { ...form };
      if (isUsers) {
        if (payload.groupId === '') {
          delete payload.groupId;
        }
        if (!payload.password) {
          delete payload.password;
        }
      } else {
        Object.keys(payload).forEach((key) => {
          if (payload[key] === '') delete payload[key];
        });
      }
      if (editId) {
        await httpClient.put(`${listUrl}/${editId}`, payload);
      } else {
        await httpClient.post(listUrl, payload);
      }
      await loadItems();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setModalMode('edit');
    setEditId(item.id);
    setModalError('');
    if (section === 'users') {
      setForm({
        login: item.login || '',
        password: '',
        fullName: item.fullName || '',
        role: item.role || 'student',
        groupId: item.groupId?.toString() || '',
        isExpelled: item.isExpelled || false
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
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      await httpClient.delete(`${listUrl}/${id}`);
      await loadItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ошибка удаления');
    } finally {
      setLoading(false);
    }
  };

  const renderRow = (item: any) => {
    if (section === 'users') {
      const isStudent = item.role === 'student';
      const roleMap: Record<string, string> = {
        'student': 'Студент',
        'teacher': 'Преподаватель',
        'admin': 'Администратор'
      };
      const roleLabel = roleMap[item.role] || item.role;

      return (
        <tr key={item.id} style={{ opacity: item.isExpelled ? 0.6 : 1 }}>
          <td>{item.login}</td>
          <td>{item.fullName}</td>
          <td>{roleLabel}</td>
          <td>{item.group?.name ?? item.groupName ?? '-'}</td>
          <td className="admin-action-cell">
            <div className="admin-action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <button className="button button-small button-secondary" onClick={() => handleEdit(item)}>Изменить</button>
              <button className="button button-danger button-small" onClick={() => handleDelete(item.id)}>Удалить</button>
            </div>
          </td>
        </tr>
      );
    }

    if (section === 'groups' || section === 'subjects') {
      return (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td className="admin-action-cell">
            <div className="admin-action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
              <button className="button button-small button-secondary" onClick={() => handleEdit(item)}>Изменить</button>
              <button className="button button-danger button-small" onClick={() => handleDelete(item.id)}>Удалить</button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id}>
        <td>{item.subjectName ?? item.subject?.name ?? item.subject?.name}</td>
        <td>{item.groupName ?? item.group?.name ?? item.group?.name}</td>
        <td>{item.teacherName ?? item.teacher?.fullName ?? item.teacher?.fullName}</td>
        <td className="admin-action-cell">
          <div className="admin-action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <button className="button button-small button-secondary" onClick={() => handleEdit(item)}>Изменить</button>
            <button className="button button-danger button-small" onClick={() => handleDelete(item.id)}>Удалить</button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <section className="card admin-panel">
      <div className="card-body">
        <div className="admin-toolbar">
          <button className="button button-primary" type="button" onClick={openCreateModal} disabled={loading}>
            Добавить
          </button>
          <div className="admin-toolbar-search">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск"
              aria-label="Поиск"
            />
            <button type="button" className="button button-secondary button-small" onClick={() => setSearchValue(searchInput)}>
              Найти
            </button>
          </div>
          <div className="admin-toolbar-menus">
            {!isGroups && (
              <div className="admin-menu-wrap">
                <button
                  type="button"
                  className="button button-secondary button-small admin-icon-button"
                  onClick={() => {
                    setIsFilterMenuOpen((value) => !value);
                    setIsSortMenuOpen(false);
                  }}
                  aria-label="Фильтр"
                  title="Фильтр"
                >
                  &#x1F5D0;
                </button>
              {isFilterMenuOpen && (
                <div className="admin-menu-popup">
                  {isUsers && (
                    <label>
                      Роль
                      <select value={filters.role} onChange={(e) => setFilters((state) => ({ ...state, role: e.target.value }))}>
                        <option value="">Все</option>
                        <option value="student">Студент</option>
                        <option value="teacher">Преподаватель</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </label>
                  )}
                  {(isUsers || isSubjects || isCourses) && (
                    <label>
                      Группа
                      <select value={filters.groupId} onChange={(e) => setFilters((state) => ({ ...state, groupId: e.target.value }))}>
                        <option value="">Все</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>{group.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {isCourses && (
                    <label>
                      Предмет
                      <select value={filters.subjectId} onChange={(e) => setFilters((state) => ({ ...state, subjectId: e.target.value }))}>
                        <option value="">Все</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}
            </div>
            )}
            <div className="admin-menu-wrap">
              <button
                type="button"
                className="button button-secondary button-small admin-icon-button"
                onClick={() => {
                  setIsSortMenuOpen((value) => !value);
                  setIsFilterMenuOpen(false);
                }}
                aria-label="Сортировка"
                title="Сортировка"
              >
                &#x21C5;
              </button>
              {isSortMenuOpen && (
                <div className="admin-menu-popup">
                  <button type="button" className="button button-secondary button-small" onClick={() => setSort('ASC')}>
                    ОТ А до Я
                  </button>
                  <button type="button" className="button button-secondary button-small" onClick={() => setSort('DESC')}>
                    ОТ Я до А
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {meta?.total != null && <p className="hint-text">Всего записей: {meta.total}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="table-responsive">
          <table className="data-table admin-data-table">
            <thead>
              <tr>
                {section === 'users' && <><th>Логин</th><th>ФИО</th><th>Роль</th><th>Группа</th></>}
                {section === 'groups' && <th>Название</th>}
                {section === 'subjects' && <th>Название</th>}
                {section === 'courses' && <><th>Предмет</th><th>Группа</th><th>Преподаватель</th></>}
                <th className="admin-actions-header">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(renderRow)}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <div className="modal-label">{sectionLabel}</div>
                  <div className="modal-title">{modalMode === 'create' ? 'Добавление' : 'Изменение'}</div>
                </div>
                <button type="button" className="modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <form className="form-grid" onSubmit={handleSubmit}>
                  {isUsers && (
                    <>
                      <label>
                        Логин
                        <input value={form.login} onChange={handleInput('login')} disabled={modalSubmitting} />
                      </label>
                      <label>
                        Пароль{modalMode === 'edit' ? ' (оставьте пустым, чтобы не менять)' : ''}
                        <input type="password" value={form.password} onChange={handleInput('password')} disabled={modalSubmitting} />
                      </label>
                      <label>
                        ФИО
                        <input value={form.fullName} onChange={handleInput('fullName')} disabled={modalSubmitting} />
                      </label>
                      <label>
                        Роль
                        <select value={form.role} onChange={handleInput('role')} disabled={modalMode === 'edit' || modalSubmitting}>
                          <option value="student">Студент</option>
                          <option value="teacher">Преподаватель</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </label>
                      <label>
                        Группа
                        <select value={form.groupId} onChange={handleInput('groupId')} disabled={modalSubmitting}>
                          <option value="">Без группы</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))}
                        </select>
                      </label>
                      {form.role === 'student' && modalMode === 'edit' && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          {!form.isExpelled ? (
                            <button type="button" className="button button-warning button-block" onClick={() => {
                              setModalSubmitting(true);
                              httpClient.put(`${listUrl}/${editId}`, { isExpelled: true })
                                .then(() => {
                                  setForm({ ...form, isExpelled: true });
                                  setModalError('');
                                  loadItems();
                                })
                                .catch((err) => setModalError(err?.response?.data?.message || 'Ошибка при отчислении'))
                                .finally(() => setModalSubmitting(false));
                            }} disabled={modalSubmitting}>
                              Отчислить студента
                            </button>
                          ) : (
                            <button type="button" className="button button-success button-block" onClick={() => {
                              setModalSubmitting(true);
                              httpClient.put(`${listUrl}/${editId}`, { isExpelled: false })
                                .then(() => {
                                  setForm({ ...form, isExpelled: false });
                                  setModalError('');
                                  loadItems();
                                })
                                .catch((err) => setModalError(err?.response?.data?.message || 'Ошибка при восстановлении'))
                                .finally(() => setModalSubmitting(false));
                            }} disabled={modalSubmitting}>
                              Восстановить студента
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {isGroups && (
                    <label>
                      Название группы
                      <input value={form.name} onChange={handleInput('name')} disabled={modalSubmitting} />
                    </label>
                  )}
                  {isSubjects && (
                    <label>
                      Название предмета
                      <input value={form.name} onChange={handleInput('name')} disabled={modalSubmitting} />
                    </label>
                  )}
                  {isCourses && (
                    <>
                      <label>
                        Преподаватель
                        <select value={form.teacherId} onChange={handleInput('teacherId')} disabled={modalSubmitting}>
                          <option value="">Выберите преподавателя</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Группа
                        <select value={form.groupId} onChange={handleInput('groupId')} disabled={modalSubmitting}>
                          <option value="">Выберите группу</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Предмет
                        <select value={form.subjectId} onChange={handleInput('subjectId')} disabled={modalSubmitting}>
                          <option value="">Выберите предмет</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  <div className="modal-actions">
                    <button className="button button-primary button-block" type="submit" disabled={modalSubmitting}>
                      {modalSubmitting ? 'Сохранение...' : modalMode === 'create' ? 'Создать' : 'Сохранить'}
                    </button>
                    <button type="button" className="button button-secondary button-block" onClick={closeModal} disabled={modalSubmitting}>
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
    </section>
  );
};

export default AdminCrudPanel;
