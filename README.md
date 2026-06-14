# Electronic Journal

## Обзор

Electronic Journal — это система управления учебным процессом, поддерживающая три роли: администратор, преподаватель и студент. Проект разделён на фронтенд на React + Vite и сервер на Express + TypeORM.

## Основные возможности

- Ролевой доступ для `admin`, `teacher` и `student`
- Аутентификация JWT через HTTP-only cookie
- Управление группами, предметами, курсами и расписанием
- Создание заданий и загрузка решений с файлами
- Система комментариев для работ и решений
- Учёт оценок, пропусков, опозданий и зачетов

## Технологии

- Фронтенд: React, Vite, TypeScript
- Бэкенд: Node.js, Express, TypeScript
- База данных: PostgreSQL через TypeORM
- Аутентификация: JWT + cookie
- Загрузка файлов: Multer

## Структура репозитория

- `/client` — фронтенд-приложение
- `/server` — API-сервер
- `/uploads/works` — файлы заданий
- `/uploads/solutions` — файлы решений

---

## Быстрый старт

### Требования

- Node.js
- npm
- PostgreSQL или другая БД, поддерживающая `DATABASE_URL`

### Запуск сервера

```bash
cd d:\ElectronicJournal\server
npm install
npm run dev
```

Сборка и запуск в production:

```bash
npm run build
npm start
```

### Запуск клиента

```bash
cd d:\ElectronicJournal\client
npm install
npm run dev
```

Сборка фронтенда:

```bash
npm run build
```

---

## Переменные окружения

Создайте файл `.env` в папке `/server` и укажите:

```env
DATABASE_URL=postgres://user:password@localhost:5432/database
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
PORT=3000
```

---

## Аутентификация

Бэкенд использует JWT, сохраняемый в HTTP-only cookie `token`.

### Вход в систему

- `POST /api/auth`
- Тело запроса:
  - `login` — логин пользователя
  - `password` — пароль пользователя
- В ответе устанавливается cookie `token`

### Выход

- `POST /api/logout`
- Требуется аутентификация
- Очищает cookie `token`

---

## Роли и полномочия

В системе используются три роли с отдельными правами.

### Администратор (`admin`)

Отвечает за:

- Управление пользователями
- Управление предметами
- Управление группами
- Управление курсами
- Управление расписанием

### Преподаватель (`teacher`)

Отвечает за:

- Просмотр своего расписания
- Просмотр групп и студентов
- Управление уроками и заданиями
- Создание и редактирование заданий с файлами
- Комментирование решений студентов
- Управление оценками, пропусками, опозданиями и зачетами

### Студент (`student`)

Отвечает за:

- Просмотр расписания группы и предметов
- Доступ к урокам и заданиям
- Комментирование работ
- Загрузку, обновление и удаление решений
- Просмотр оценок, пропусков, опозданий и зачетов

---

## API

Базовый URL: `/api`

### Аутентификация

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| POST | `/api/auth` | Авторизация пользователя и установка JWT cookie |
| POST | `/api/logout` | Выход из системы и удаление cookie |

---

### Загрузка файлов

Требуется аутентификация.

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/files/works/:fileId` | Загрузка файла задания |
| GET | `/api/files/solutions/:fileId` | Загрузка файла решения |

---

## Админ API (`/api/admin`)

Требуется роль `admin`.

### Пользователи

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/admin/users` | Получение списка пользователей с фильтрацией |
| POST | `/api/admin/users` | Создание пользователя |
| DELETE | `/api/admin/users/:userId` | Удаление пользователя |
| PUT | `/api/admin/users/:userId` | Обновление пользователя |

### Предметы

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/admin/subjects` | Получение списка предметов |
| POST | `/api/admin/subjects` | Создание предмета |
| DELETE | `/api/admin/subjects/:subjectId` | Удаление предмета |
| PUT | `/api/admin/subjects/:subjectId` | Обновление предмета |

### Группы

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/admin/groups` | Получение списка групп |
| POST | `/api/admin/groups` | Создание группы |
| DELETE | `/api/admin/groups/:groupId` | Удаление группы |
| PUT | `/api/admin/groups/:groupId` | Обновление группы |

### Курсы

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/admin/courses` | Получение списка курсов |
| POST | `/api/admin/courses` | Создание курса |
| DELETE | `/api/admin/courses/:courseId` | Удаление курса |
| PUT | `/api/admin/courses/:courseId` | Обновление курса |

### Расписание

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/admin/timetables` | Получение расписаний |
| POST | `/api/admin/timetables` | Добавление расписаний |
| DELETE | `/api/admin/timetables/:timetableId` | Удаление записи расписания |
| PUT | `/api/admin/timetables/:timetableId` | Обновление записи расписания |

---

## API преподавателя (`/api/teacher`)

Требуется роль `teacher`.

### Расписание

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/timetable` | Получение расписания преподавателя |

### Группы и предметы

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups` | Получение групп преподавателя |
| GET | `/api/teacher/groups/:groupId/subjects` | Получение предметов группы |
| GET | `/api/teacher/groups/:groupId/students` | Получение студентов группы |

### Уроки

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons` | Получение списка уроков |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons` | Создание урока |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId` | Удаление урока |

### Задания

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId` | Получение информации о задании |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works` | Создание задания с файлами |
| PUT | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId` | Обновление задания и файлов |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId` | Удаление задания |

### Комментарии к заданиям

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/comments` | Получение комментариев к заданию |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/comments` | Добавление комментария к заданию |
| PUT | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/comments/:commentId` | Обновление комментария к заданию |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/comments/:commentId` | Удаление комментария к заданию |

### Решения студентов

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId` | Получение решения студента |

### Комментарии к решениям

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments` | Получение комментариев к решению |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments` | Добавление комментария к решению |
| PUT | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId` | Обновление комментария к решению |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId` | Удаление комментария к решению |

### Оценки

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/marks` | Получение оценок студентов |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks` | Добавление оценки |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:markId` | Удаление оценки |
| PATCH | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:markId` | Обновление оценки |

### Пропуски

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/absences` | Получение пропусков студентов |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences` | Создание записи о пропуске |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences/:absenceId` | Удаление записи о пропуске |

### Опоздания

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/lates` | Получение опозданий студентов |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates` | Создание записи об опоздании |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:lateId` | Удаление записи об опоздании |
| PATCH | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:lateId` | Обновление записи об опоздании |

### Зачеты

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/teacher/groups/:groupId/subjects/:subjectId/credits` | Получение зачетов студентов |
| POST | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits` | Добавление зачета |
| DELETE | `/api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits/:creditId` | Удаление зачета |

---

## API студента (`/api/student`)

Требуется роль `student`.

### Расписание и предметы

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/student/timetable/:groupId` | Получение расписания группы |
| GET | `/api/student/subjects` | Получение списка предметов |
| GET | `/api/student/subjects/:subjectId/lessons` | Получение уроков по предмету |

### Задания

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId` | Получение информации о задании |

### Комментарии к заданиям

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments` | Получение комментариев к заданию |
| POST | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments` | Добавление комментария к заданию |
| PUT | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments/:commentId` | Обновление комментария к заданию |
| DELETE | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments/:commentId` | Удаление комментария к заданию |

### Решения

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId` | Получение решения |
| POST | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions` | Отправка решения с файлами |
| PUT | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId` | Обновление решения |
| DELETE | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId` | Удаление решения |

### Комментарии к решениям

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments` | Получение комментариев к решению |
| POST | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments` | Добавление комментария к решению |
| PUT | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId` | Обновление комментария к решению |
| DELETE | `/api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId` | Удаление комментария к решению |

### Учебные записи

| Метод | Эндпоинт | Описание |
| --- | --- | --- |
| GET | `/api/student/subjects/:subjectId/marks` | Получение оценок по предмету |
| GET | `/api/student/subjects/:subjectId/absences` | Получение пропусков по предмету |
| GET | `/api/student/subjects/:subjectId/lates` | Получение опозданий по предмету |
| GET | `/api/student/subjects/:subjectId/credits` | Получение зачетов по предмету |

---

## Загрузка файлов

### Загрузка преподавателем

- `POST /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works`
- `PUT /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId`

Используйте `multipart/form-data` для загрузки файлов заданий.

### Загрузка студентом

- `POST /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions`
- `PUT /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId`

Используйте `multipart/form-data` для загрузки файлов решений.

---

## Примечания

- Бэкенд создаёт директории `uploads/works` и `uploads/solutions` при запуске.
- Мидлвэр авторизации проверяет JWT в cookie и права доступа по роли.
- Все защищённые эндпоинты требуют аутентификацию.

### Комментарии к решениям

- `GET /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments`
- `POST /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments`
- `PUT /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId`
- `DELETE /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId`

### Оценки

- `GET /api/teacher/groups/:groupId/subjects/:subjectId/marks`
  - Просмотр оценок по группе и предмету.
- `POST /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks`
  - Создание оценки.
- `DELETE /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:markId`
  - Удаление оценки.
- `PATCH /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:markId`
  - Обновление оценки.

### Пропуски

- `GET /api/teacher/groups/:groupId/subjects/:subjectId/absences`
- `POST /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences`
- `DELETE /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences/:absenceId`

### Опоздания

- `GET /api/teacher/groups/:groupId/subjects/:subjectId/lates`
- `POST /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates`
- `DELETE /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:lateId`
- `PATCH /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:lateId`

### Зачеты

- `GET /api/teacher/groups/:groupId/subjects/:subjectId/credits`
- `POST /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits`
- `DELETE /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits/:creditId`

## Эндпоинты студента `/api/student`

Требуется роль `student`.

### Расписание и предметы

- `GET /api/student/timetable/:groupId`
  - Расписание группы студента.
- `GET /api/student/subjects`
  - Список предметов студента.
- `GET /api/student/subjects/:subjectId/lessons`
  - Уроки в предмете.

### Задания

- `GET /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId`
  - Просмотр задания.

### Комментарии к заданиям

- `GET /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments`
- `POST /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments`
- `PUT /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments/:commentId`
- `DELETE /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/comments/:commentId`

### Решения

- `GET /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId`
- `POST /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions`
- `PUT /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId`
- `DELETE /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId`

### Комментарии к решениям

- `GET /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments`
- `POST /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments`
- `PUT /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId`
- `DELETE /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId/comments/:commentId`

### Учебные данные

- `GET /api/student/subjects/:subjectId/marks`
- `GET /api/student/subjects/:subjectId/absences`
- `GET /api/student/subjects/:subjectId/lates`
- `GET /api/student/subjects/:subjectId/credits`

## Загрузка файлов

### Для преподавателя

- `POST /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works`
- `PUT /api/teacher/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId`

Эти маршруты принимают `multipart/form-data` с файлами для задания.

### Для студента

- `POST /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions`
- `PUT /api/student/subjects/:subjectId/lessons/:lessonId/works/:workId/solutions/:solutionId`

Эти маршруты принимают `multipart/form-data` с файлами решения.

## Примечания

- Сервер создает папки `uploads/works` и `uploads/solutions` при старте.
- Проверка прав выполняется с помощью JWT и роли пользователя.
- Все защищенные маршруты должны вызываться с cookie `token`.
