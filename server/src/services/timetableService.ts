import { AppDataSource } from "@/config/data-source";
import { TimetableDTO } from "@/dto/timetableDTO";
import { Course } from "@/entities/course";
import { Group } from "@/entities/group";
import { LessonTimings } from "@/entities/lessonTimings";
import { Timetable } from "@/entities/timetable";
import { AppError } from "@/utils/appError";
import { JwtPayload } from "@/middlewares/authMiddleware";
import { In, Not } from "typeorm";
import { User } from "@/entities/user";


export class TimetableService {
    private static timetableRepository = AppDataSource.getRepository(Timetable);
    private static lessonTimingsRepository = AppDataSource.getRepository(LessonTimings);
    private static courseRepository = AppDataSource.getRepository(Course);
    private static groupRepository = AppDataSource.getRepository(Group);
    private static userRepository = AppDataSource.getRepository(User);

    public static async getTimetables(userInfo: JwtPayload, groupId: number) {
        const group = this.groupRepository.findOneBy({ id: groupId });
        if (!group) {
            throw new AppError(`Не найдена группа с id ${groupId}`, 404);
        } 
        

        if (userInfo.role !== 'admin') {
            const user = await this.userRepository.findOneBy({ id: userInfo.id });
            if (!user) {
                throw new AppError(`Не найден пользователь с id ${userInfo.id}`, 404);
            }

            switch (userInfo.role) {
                case 'student':
                    if (user.groupId != groupId) {
                        throw new AppError(`Студент с id ${user.id} не учится в группе с id ${groupId}`, 403);
                    }
                case 'teacher':
                    if (user.groupId !== groupId) {
                        const teacherCourses = await this.courseRepository.findBy({ teacherId: user.id });
                        if (!teacherCourses.some(c => c.groupId === groupId)) {
                            throw new AppError(`Преподаватель с id ${user.id} не является куратором или преподавателем в группе с id ${groupId}`, 403);
                        }
                    }
                default:
                    throw new AppError('Неизвестная роль пользователя', 400);
            }
        }

        const timetables = await this.timetableRepository.find({ 
            where: { groupId },
            relations: {
                course: {
                    subject: true,
                    teacher: true
                },
                lessonTimings: true
            },
            order: {
                dayOfWeek: 'ASC',
                lessonTimings: { lessonNumber: 'ASC' }
            }
        });

        const grouped: Record<number, any[]> = {};
        for (const t of timetables) {
            const day = t.dayOfWeek;
            if (!grouped[day]) grouped[day] = [];

                grouped[day].push({
                    id: t.id,
                    courseId: t.courseId,
                    subjectName: t.course.subject.name,
                    teacherName: t.course.teacher.fullName,
                    room: t.room,
                    lessonNumber: t.lessonTimings.lessonNumber,
                    startTime: t.lessonTimings.startTime,    
                    endTime: t.lessonTimings.endTime,
                });
        }

        const data = Object.entries(grouped).map(([dayStr, lessons]) => ({
            dayOfWeek: Number(dayStr), 
            lessons,
        }));

        return { data: data };
    }

    public static async addTimetable(dtos: TimetableDTO[]) {
        if (!dtos.length) {
            throw new AppError('Пустой список записей расписания', 400);
        }

        const courseIds = [...new Set(dtos.map(d => d.courseId))];
        const lessonNumbers = [...new Set(dtos.map(d => d.lessonNumber))];
        const days = [...new Set(dtos.map(d => d.dayOfWeek))];
        const rooms = [...new Set(dtos.map(d => d.room))];

        const courses = await this.courseRepository.find({
            where: { id: In(courseIds) },
            relations: ['teacher', 'group']
        });
        const courseMap = new Map(courses.map(c => [c.id, c]));

        const timings = await this.lessonTimingsRepository.find({
            where: { lessonNumber: In(lessonNumbers) }
        });
        const timingsMap = new Map(timings.map(t => [t.lessonNumber, t.id]));

        for (const dto of dtos) {
            if (!courseMap.has(dto.courseId)) {
                throw new AppError(`Курс с id ${dto.courseId} не найден`, 404);
            }
            if (!timingsMap.has(dto.lessonNumber)) {
                throw new AppError(`Некорректный номер урока: ${dto.lessonNumber}`, 400);
            }
        }

        const firstCourse = courses[0];
        const firstGroupId = firstCourse.groupId;
        const allSameGroup = courses.every(c => c.groupId === firstGroupId);
        if (!allSameGroup) {
            throw new AppError('Все курсы должны принадлежать одной группе', 400);
        }

        const lessonTimingIds = lessonNumbers.map(n => timingsMap.get(n)!);
        const existingTimetables = await this.timetableRepository.find({
            where: {
                dayOfWeek: In(days),
                lessonTimingsId: In(lessonTimingIds)
            }
        });

        const courseDayLessonSet = new Set(
            existingTimetables.map(e => `${e.courseId}_${e.dayOfWeek}_${e.lessonTimingsId}`)
        );
        const teacherDayLessonSet = new Set(
            existingTimetables.map(e => `${e.teacherId}_${e.dayOfWeek}_${e.lessonTimingsId}`)
        );
        const groupDayLessonSet = new Set(
            existingTimetables.map(e => `${e.groupId}_${e.dayOfWeek}_${e.lessonTimingsId}`)
        );
        const roomDayLessonSet = new Set(
            existingTimetables.map(e => `${e.room}_${e.dayOfWeek}_${e.lessonTimingsId}`)
        );

        const errors: string[] = [];
        const toInsert: Timetable[] = [];

        const currentBatchKeys = new Set<string>();
        const currentGroupKeys = new Set<string>();
        const currentTeacherKeys = new Set<string>();
        const currentRoomKeys = new Set<string>();

        for (const [index, dto] of dtos.entries()) {
            const course = courseMap.get(dto.courseId)!;
            const lessonTimingId = timingsMap.get(dto.lessonNumber)!;

            const courseKey = `${dto.courseId}_${dto.dayOfWeek}_${lessonTimingId}`;
            const teacherKey = `${course.teacherId}_${dto.dayOfWeek}_${lessonTimingId}`;
            const groupKey = `${course.groupId}_${dto.dayOfWeek}_${lessonTimingId}`;
            const roomKey = `${dto.room}_${dto.dayOfWeek}_${lessonTimingId}`;

            if (currentBatchKeys.has(courseKey)) {
                errors.push(`Запись ${index+1}: курс уже присутствует в загружаемом списке`);
                continue;
            }
            if (currentGroupKeys.has(groupKey)) {
                errors.push(`Запись ${index+1}: группа ${course.group?.name || '??'} уже занята в это время в текущем наборе`);
                continue;
            }
            if (currentTeacherKeys.has(teacherKey)) {
                errors.push(`Запись ${index+1}: преподаватель ${course.teacher?.fullName || '??'} уже занят в это время в текущем наборе`);
                continue;
            }
            if (currentRoomKeys.has(roomKey)) {
                errors.push(`Запись ${index+1}: кабинет ${dto.room} уже занят в это время в текущем наборе`);
                continue;
            }

            if (courseDayLessonSet.has(courseKey)) {
                errors.push(`Запись ${index+1}: этот курс уже существует в расписании`);
                continue;
            }
            if (teacherDayLessonSet.has(teacherKey)) {
                errors.push(`Запись ${index+1}: преподаватель ${course.teacher?.fullName || '??'} уже занят в это время`);
                continue;
            }
            if (groupDayLessonSet.has(groupKey)) {
                errors.push(`Запись ${index+1}: группа ${course.group?.name || '??'} уже занята в это время`);
                continue;
            }
            if (roomDayLessonSet.has(roomKey)) {
                errors.push(`Запись ${index+1}: кабинет ${dto.room} уже занят в это время`);
                continue;
            }

            currentBatchKeys.add(courseKey);
            currentGroupKeys.add(groupKey);
            currentTeacherKeys.add(teacherKey);
            currentRoomKeys.add(roomKey);

            toInsert.push(this.timetableRepository.create({
                courseId: dto.courseId,
                teacherId: course.teacherId,
                groupId: course.groupId,
                dayOfWeek: dto.dayOfWeek,
                room: dto.room,
                lessonTimingsId: lessonTimingId
            }));
        }

        if (errors.length > 0) {
            throw new AppError(`Конфликты в расписании: ${errors.join('\n')}`, 409);
        }

        if (toInsert.length > 0) {
            await AppDataSource.transaction(async manager => {
                await manager.save(toInsert);
            });
        }

        return {
            data: toInsert.map(t => ({
                id: t.id,
                courseId: t.courseId,
                dayOfWeek: t.dayOfWeek,
                room: t.room,
                lessonNumber: lessonNumbers[lessonTimingIds.indexOf(t.lessonTimingsId)],
                teacherId: t.teacherId,
                groupId: t.groupId
            }))
        };
    }

    public static async updateTimetable(id: number, dto: TimetableDTO) {
        const timetable = await this.timetableRepository.findOneBy({ id });
        if (!timetable) {
            throw new AppError(`Запись расписания с id ${id} не найдена`, 404);
        }

        const course = await this.courseRepository.findOne({
            where: { id: dto.courseId },
            relations: ['teacher', 'group']
        });
        if (!course) {
            throw new AppError(`Курс с id ${dto.courseId} не найден`, 404);
        }
        const timing = await this.lessonTimingsRepository.findOneBy({ lessonNumber: dto.lessonNumber });
        if (!timing) {
            throw new AppError(`Некорректный номер урока: ${dto.lessonNumber}`, 400);
        }

        const newCourseId = dto.courseId;
        const newDay = dto.dayOfWeek;
        const newRoom = dto.room;
        const newLessonTimingId = timing.id;
        const newTeacherId = course.teacherId;
        const newGroupId = course.groupId;

        const conflict = await this.timetableRepository.findOne({
            where: [
                { courseId: newCourseId, dayOfWeek: newDay, lessonTimingsId: newLessonTimingId, id: Not(id) },
                { teacherId: newTeacherId, dayOfWeek: newDay, lessonTimingsId: newLessonTimingId, id: Not(id) },
                { groupId: newGroupId, dayOfWeek: newDay, lessonTimingsId: newLessonTimingId, id: Not(id) },
                { room: newRoom, dayOfWeek: newDay, lessonTimingsId: newLessonTimingId, id: Not(id) },
            ]
        });

        if (conflict) {
            if (conflict.courseId === newCourseId) {
                throw new AppError('Этот курс уже стоит в расписании на это время', 409);
            }
            if (conflict.teacherId === newTeacherId) {
                throw new AppError(`Преподаватель ${course.teacher?.fullName || '??'} уже занят в это время`, 409);
            }
            if (conflict.groupId === newGroupId) {
                throw new AppError(`Группа ${course.group?.name || '??'} уже занята в это время`, 409);
            }
            if (conflict.room === newRoom) {
                throw new AppError(`Кабинет ${newRoom} уже занят в это время`, 409);
            }
        }

        timetable.courseId = newCourseId;
        timetable.teacherId = newTeacherId;
        timetable.groupId = newGroupId;
        timetable.dayOfWeek = newDay;
        timetable.room = newRoom;
        timetable.lessonTimingsId = newLessonTimingId;

        await this.timetableRepository.save(timetable);

        return {
            data: {
                id: timetable.id,
                courseId: timetable.courseId,
                dayOfWeek: timetable.dayOfWeek,
                room: timetable.room,
                lessonNumber: dto.lessonNumber,
                teacherId: timetable.teacherId,
                groupId: timetable.groupId
            }
        };
    }

    public static async deleteTimetable(timetableId: number) {
        const timetable = await this.timetableRepository.findOneBy({ id: timetableId });
        if (!timetable) {
            throw new AppError(`Не найдена запись расписания с id ${timetableId}`, 404);
        }

        await this.timetableRepository.delete({ id: timetableId });
    }
}