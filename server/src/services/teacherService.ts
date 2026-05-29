import { AppDataSource } from "@/config/data-source";
import { LateDTO } from "@/dto/lateDTO";
import { LessonDTO } from "@/dto/lessonDTO";
import { MarkDTO } from "@/dto/markDTO";
import { Absence } from "@/entities/absence";
import { Course } from "@/entities/course";
import { Credit } from "@/entities/credit";
import { Group } from "@/entities/group";
import { Late } from "@/entities/late";
import { Lesson, LessonType } from "@/entities/lesson";
import { LessonTimings } from "@/entities/lessonTimings";
import { Mark } from "@/entities/mark";
import { Subject } from "@/entities/subject";
import { Timetable } from "@/entities/timetable";
import { User, UserRole } from "@/entities/user";
import { AppError } from "@/utils/appError";
import { LessThan, MoreThan } from "typeorm";

export class TeacherService {
    private static userRepository = AppDataSource.getRepository(User);
    private static courseRepository = AppDataSource.getRepository(Course);
    private static groupRepository = AppDataSource.getRepository(Group);
    private static subjectRepository = AppDataSource.getRepository(Subject);
    private static lessonRepository = AppDataSource.getRepository(Lesson);
    private static markRepository = AppDataSource.getRepository(Mark);
    private static absenceRepository = AppDataSource.getRepository(Absence);
    private static lateRepository = AppDataSource.getRepository(Late);
    private static creditRepository = AppDataSource.getRepository(Credit);
    private static lessonTimingsRepository = AppDataSource.getRepository(LessonTimings);
    private static timetableRepository = AppDataSource.getRepository(Timetable);

    public static async addLesson(userId: number, subjectId: number, groupId: number, dto: LessonDTO) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);

        const dateOnly = new Date(dto.date).toISOString().substring(0, 10);
        const today = new Date().toISOString().substring(0, 10);
        if (dateOnly > today) {
            throw new AppError('Нельзя создавать урок на будущую дату', 400);
        }

        if (await this.lessonRepository.count({ where: { course: { groupId: groupId }, date: dateOnly }}) >= 8) {
            throw new AppError(`У группы с id ${groupId} ${dateOnly} уже было 8 уроков`, 422);
        }

        const newLesson = this.lessonRepository.create({
            course: course,
            date: dateOnly,
            topic: dto.topic,
            type: dto.type
        });
        await this.lessonRepository.save(newLesson);

        return {
            data: { id: newLesson.id, date: newLesson.date, topic: newLesson.topic, type: newLesson.type, courseId: course.id }
        };
    }

    public static async deleteLesson(userId: number, subjectId: number, groupId: number, lessonId: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        await this.lessonRepository.delete(lesson);
    }

    public static async addMark(userId: number, subjectId: number, groupId: number, lessonId: number, dto: MarkDTO) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkStudent(dto.studentId, groupId);

        return await AppDataSource.transaction(async (manager) => {
            const markRepo = manager.getRepository(Mark);
            const creditRepo = manager.getRepository(Credit);
            
            if (await markRepo.findOne({ where: { lessonId: lessonId, studentId: dto.studentId }})) {
                throw new AppError(`У студента с id ${dto.studentId} уже есть отметка по уроку с id ${lessonId}`, 400);
            }
            
            const newMark = markRepo.create({
                lessonId: lessonId,
                mark: dto.mark,
                studentId: dto.studentId,
            });
            await markRepo.save(newMark);

            let newCredit = null;
            if ((lesson.type === LessonType.LAB || lesson.type === LessonType.PRACTICE) && dto.mark > 3
                && !await creditRepo.findOne({ where: { lessonId: lessonId, studentId: dto.studentId }})) {

                newCredit = creditRepo.create({
                    studentId: dto.studentId,
                    lessonId: lessonId
                });

                await creditRepo.save(newCredit);
            }

            return {
                data: {
                    id: newMark.id,
                    lessonId: newMark.lessonId,
                    mark: newMark.mark,
                    studentId: newMark.studentId,
                    credit: newCredit ? { id: newCredit.id, lessonId: newCredit.lessonId, studentId: newCredit.studentId } : undefined,
                }
            };
        });
        
    }

    public static async deleteMark(userId: number, subjectId: number, groupId: number, lessonId: number, markId: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        
        return await AppDataSource.transaction(async (manager) => {
            const markRepo = manager.getRepository(Mark);
            const creditRepo = manager.getRepository(Credit);

            const mark = await markRepo.findOneBy({ id: markId, lessonId: lessonId });
            if (!mark) {
                throw new AppError(`Не найдена оценка с id ${markId} на уроке с id ${lessonId}`, 404);
            }

            if ((lesson.type === LessonType.LAB || lesson.type === LessonType.PRACTICE)) {
                const credit = await creditRepo.findOne({ where: { lessonId: lessonId, studentId: mark.studentId }});
                if (credit) {
                    await creditRepo.delete(credit);
                }
            }

            await markRepo.delete(mark);
        });
    }

    public static async updateMark(userId: number, subjectId: number, groupId: number, lessonId: number, markId: number, newMark: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        return await AppDataSource.transaction(async (manager) => {
            const markRepo = manager.getRepository(Mark);
            const creditRepo = manager.getRepository(Credit);

            const mark = await markRepo.findOneBy({ id: markId, lessonId: lessonId });
            if (!mark) {
                throw new AppError(`Не найдена оценка с id ${markId} на уроке с id ${lessonId}`, 404);
            }

            await this.checkStudent(mark.studentId, groupId);
            mark.mark = newMark;

            let newCredit = null;
            if (lesson.type === LessonType.LAB || lesson.type === LessonType.PRACTICE) {
                if (mark.mark > 3 && !await creditRepo.findOne({ where: { lessonId: lessonId, studentId: mark.studentId }})) {
                    
                    newCredit = creditRepo.create({
                        studentId: mark.studentId,
                        lessonId: lessonId
                    });

                    await creditRepo.save(newCredit);
                } else if (mark.mark < 3 && await creditRepo.findOne({ where: { lessonId: lessonId, studentId: mark.studentId }})) {
                    const credit = await creditRepo.findOne({ where: { lessonId: lessonId, studentId: mark.studentId }});
                    if (credit) {
                        await creditRepo.delete(credit);
                    }
                }
            }

            await markRepo.save(mark);
            return {
                data: {
                    id: mark.id,
                    lessonId: mark.lessonId,
                    mark: mark.mark,
                    studentId: mark.studentId,
                    credit: newCredit ? { id: newCredit.id, lessonId: newCredit.lessonId, studentId: newCredit.studentId } : undefined,
                }
            };
        });
    }

    public static async addLate(userId: number, subjectId: number, groupId: number, lessonId: number, dto: LateDTO) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkStudent(dto.studentId, groupId);
        
        if (await this.lateRepository.findOne({ where: { lessonId: lessonId, studentId: dto.studentId }})) {
            throw new AppError(`У студента с id ${dto.studentId} уже есть опоздание на урок с id ${lessonId}`, 400);
        }

        let newLate;
        if (!dto.minutes) {
            const minutes = await this.calculateLateMinutes(groupId, lesson);

            newLate = this.lateRepository.create({
                lessonId: lessonId,
                minutes: minutes,
                studentId: dto.studentId
            });
        } else {
            newLate = this.lateRepository.create({
                lessonId: lessonId,
                minutes: dto.minutes,
                studentId: dto.studentId
            });
        }

        await this.lateRepository.save(newLate);

        return {
            data: { id: newLate.id, lessonId: newLate.lessonId, studentId: newLate.studentId, minutes: newLate.minutes }
        };
    }

    public static async deleteLate(userId: number, subjectId: number, groupId: number, lessonId: number, lateId: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        
        const late = await this.lateRepository.findOneBy({ id: lateId, lessonId: lessonId });
        if (!late) {
            throw new AppError(`Не найдено опоздание с id ${lateId} на уроке с id ${lessonId}`, 404);
        }

        await this.lateRepository.delete(late);
    }

    public static async updateLate(userId: number, subjectId: number, groupId: number, lessonId: number, lateId: number, minutes?: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        const late = await this.lateRepository.findOneBy({ id: lateId, lessonId: lessonId });
        if (!late) {
            throw new AppError(`Не найдено опоздание с id ${lateId} на уроке с id ${lessonId}`, 404);
        }

        if (!minutes) {
            const calculatedMinutes = await this.calculateLateMinutes(groupId, lesson);

            late.minutes = calculatedMinutes;
        } else {
            late.minutes = minutes;
        }

        await this.lateRepository.save(late);

        return {
            data: { id: late.id, lessonId: late.lessonId, studentId: late.studentId, minutes: late.minutes }
        };
    }

    public static async addAbsence(userId: number, subjectId: number, groupId: number, lessonId: number, studentId: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkStudent(studentId, groupId);
        
        if (await this.absenceRepository.findOne({ where: { lessonId: lessonId, studentId: studentId }})) {
            throw new AppError(`У студента с id ${studentId} уже есть отсутствие на уроке с id ${lessonId}`, 400);
        }

        const newAbsence = this.absenceRepository.create({
            lessonId: lessonId,
            studentId: studentId
        });
        await this.absenceRepository.save(newAbsence);

        return {
            data: { id: newAbsence.id, lessonId: newAbsence.lessonId, studentId: newAbsence.studentId }
        };
    }

    public static async deleteAbsence(userId: number, subjectId: number, groupId: number, lessonId: number, absenceId: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        
        const absence = await this.absenceRepository.findOneBy({ id: absenceId, lessonId: lessonId });
        if (!absence) {
            throw new AppError(`Не найдено отсутствие с id ${absenceId} на уроке с id ${lessonId}`, 404);
        }

        await this.absenceRepository.delete(absence);
    }

    public static async addCredit(userId: number, subjectId: number, groupId: number, lessonId: number, studentId: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkStudent(studentId, groupId);
        
        if (lesson.type !== LessonType.LAB && lesson.type !== LessonType.PRACTICE) {
            throw new AppError('Зачеты можно ставить только по лабораторным и практикам', 422);
        }

        if (await this.creditRepository.findOne({ where: { lessonId: lessonId, studentId: studentId }})) {
            throw new AppError(`У студента с id ${studentId} уже есть зачет на уроке с id ${lessonId}`, 400);
        }

        const newCredit = this.creditRepository.create({
            lessonId: lessonId,
            studentId: studentId
        });
        await this.creditRepository.save(newCredit);

        return {
            data: { id: newCredit.id, lessonId: newCredit.lessonId, studentId: newCredit.studentId }
        };
    }

    public static async deleteCredit(userId: number, subjectId: number, groupId: number, lessonId: number, creditId: number) {
        const course = await this.checkTeacherAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        
        const credit = await this.creditRepository.findOneBy({ id: creditId, lessonId: lessonId });
        if (!credit) {
            throw new AppError(`Не найден зачет с id ${creditId} на уроке с id ${lessonId}`, 404);
        }

        await this.creditRepository.delete(credit);
    }

    public static async getGroups(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }
        
        const teachingCourses = await this.courseRepository.find({
            where: { teacherId: userId },
            relations: ['group']
        });
        
        const groupsMap = new Map<number, Group>();

        if (user.group) {
            groupsMap.set(user.group.id, user.group);
        }

        for (const course of teachingCourses) {
            if (!groupsMap.has(course.groupId)) {
                groupsMap.set(course.groupId, course.group);
            }
        }

        const result = Array.from(groupsMap.values()).map(group => ({
            id: group.id,
            name: group.name,
            isCurator: user.group?.id === group.id
        }));

        return { data: result };
    }

    public static async getStudents (userId: number, groupId: number) {
        await this.checkTeacherAndGroup(userId, groupId);

        const group = await this.groupRepository.findOne({ where: { id: groupId }, relations: ['students']});
        if (!group) {
            throw new AppError(`Не найдена группа с id ${groupId}`, 404);
        }

        const curator = group.students.find((user) => user.role === UserRole.TEACHER);
        const students = group.students.filter((user) => user.role === UserRole.STUDENT);

        return {
            data: {
                students,
                curator: curator ? { id: curator.id, fullName: curator.fullName } : null
            }
        };
    }

    public static async getSubjects(userId: number, groupId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        const group = await this.groupRepository.findOneBy({ id: groupId });
        if (!group) {
            throw new AppError(`Не найдена группа с id ${groupId}`, 404);
        }

        const isCurator = user.group?.id === groupId;

        const teacherCourses = await this.courseRepository.find({
            where: { groupId: groupId, teacherId: userId },
            relations: ['subject']
        });

        if (!isCurator && teacherCourses.length === 0) {
            throw new AppError(`Преподаватель с id ${userId} не имеет доступа к группе с id ${groupId}`, 403);
        }

        let subjects: { id: number, name: string, canEdit: boolean }[];

        if (isCurator) {
            const allGroupCourses = await this.courseRepository.find({
                where: { groupId: groupId },
                relations: ['subject']
            });
            const taughtSubjectIds = new Set(teacherCourses.map(c => c.subjectId));

            subjects = allGroupCourses.map(c => ({
                id: c.subject.id,
                name: c.subject.name,
                canEdit: taughtSubjectIds.has(c.subject.id)
            }));
        } else {
            subjects = teacherCourses.map(c => ({
                id: c.subject.id,
                name: c.subject.name,
                canEdit: true
            }));
        }

        const uniqueSubjects = Array.from(
            new Map(subjects.map(s => [s.id, s])).values()
        );

        return { data: uniqueSubjects };
    }

    public static async getLessons(userId: number, groupId: number, subjectId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        await this.checkGroupAndSubjectExistance(groupId, subjectId);
        
        if (user.group?.id !== groupId) {
            const course = await this.courseRepository.findOneBy({ subjectId: subjectId, groupId: groupId, teacherId: userId });
            if (!course) {
                throw new AppError(`Преподаватель с id ${userId} не имеет доступа к предмету с id ${subjectId} в группе с id ${groupId}`, 403);
            }
        }
        
        const lessons = await this.lessonRepository
            .createQueryBuilder('lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.teacherId = :teacherId', { teacherId: userId })
            .andWhere('course.groupId = :groupId', { groupId: groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: lessons };
    }

    public static async getStudentsMarks(userId: number, groupId: number, subjectId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        await this.checkGroupAndSubjectExistance(groupId, subjectId);

        if (user.group?.id !== groupId) {
            const course = await this.courseRepository.findOneBy({ subjectId: subjectId, groupId: groupId, teacherId: userId });
            if (!course) {
                throw new AppError(`Преподаватель с id ${userId} не имеет доступа к предмету с id ${subjectId} в группе с id ${groupId}`, 403)
            }
        }

        const marks = await this.markRepository
            .createQueryBuilder('mark')
            .innerJoin('mark.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.teacherId = :teacherId', { teacherId: userId })
            .andWhere('course.groupId = :groupId', { groupId: groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: marks };
    }

    public static async getStudentsAbsences(userId: number, groupId: number, subjectId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        await this.checkGroupAndSubjectExistance(groupId, subjectId);

        if (user.group?.id !== groupId) {
            const course = await this.courseRepository.findOneBy({ subjectId: subjectId, groupId: groupId, teacherId: userId });
            if (!course) {
                throw new AppError(`Преподаватель с id ${userId} не имеет доступа к предмету с id ${subjectId} в группе с id ${groupId}`, 403)
            }
        }

        const absences = await this.absenceRepository
            .createQueryBuilder('absence')
            .innerJoin('absence.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.teacherId = :teacherId', { teacherId: userId })
            .andWhere('course.groupId = :groupId', { groupId: groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: absences };
    }

    public static async getStudentsLates(userId: number, groupId: number, subjectId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        await this.checkGroupAndSubjectExistance(groupId, subjectId);

        if (user.group?.id !== groupId) {
            const course = await this.courseRepository.findOneBy({ subjectId: subjectId, groupId: groupId, teacherId: userId });
            if (!course) {
                throw new AppError(`Преподаватель с id ${userId} не имеет доступа к предмету с id ${subjectId} в группе с id ${groupId}`, 403)
            }
        }

        const lates = await this.lateRepository
            .createQueryBuilder('late')
            .innerJoin('late.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.teacherId = :teacherId', { teacherId: userId })
            .andWhere('course.groupId = :groupId', { groupId: groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: lates };
    }

    public static async getStudentsCredits(userId: number, groupId: number, subjectId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        await this.checkGroupAndSubjectExistance(groupId, subjectId);

        if (user.group?.id !== groupId) {
            const course = await this.courseRepository.findOneBy({ subjectId: subjectId, groupId: groupId, teacherId: userId });
            if (!course) {
                throw new AppError(`Преподаватель с id ${userId} не имеет доступа к предмету с id ${subjectId} в группе с id ${groupId}`, 403)
            }
        }

        const credits = await this.creditRepository
            .createQueryBuilder('credit')
            .innerJoin('credit.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.teacherId = :teacherId', { teacherId: userId })
            .andWhere('course.groupId = :groupId', { groupId: groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: credits };
    }

    private static async checkGroupAndSubjectExistance(groupId: number, subjectId: number) {
        const group = await this.groupRepository.findOneBy({ id: groupId });
        if (!group) {
            throw new AppError(`Не найдена группа с id ${groupId}`, 404);
        }

        const subject = await this.subjectRepository.findOneBy({ id: subjectId });
        if (!subject) {
            throw new AppError(`Не найден предмет с id ${subjectId}`, 404);
        }
    }

    private static async checkStudent(studentId: number, groupId: number) {
        const student = await this.userRepository.findOneBy({ id: studentId, role: UserRole.STUDENT });
        if (!student) {
            throw new AppError(`Не найден студент с id ${studentId}`, 404);
        }

        if (student.groupId !== groupId) {
            throw new AppError(`Студент с id ${studentId} не учится в группе с id ${groupId}`, 400);
        }

        if (student.isExpelled) {
            throw new AppError(`Студент с id ${studentId} отчислен`, 400);
        }
    }

    private static async checkTeacherAndGroup (teacherId: number, groupId: number) {
        const user = await this.userRepository.findOne({ where: { id: teacherId, role: UserRole.TEACHER }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${teacherId}`, 404);
        }

        const course = await this.courseRepository.findOneBy({ teacherId: teacherId, groupId: groupId });
        if (!course) {
            throw new AppError(`Преподаватель с id ${teacherId} не имеет доступа к группе с id ${groupId}`, 403);
        }
    } 

    private static async checkTeacherAndCourse(teacherId: number, groupId: number, subjectId: number) {
        const user = await this.userRepository.findOne({ where: { id: teacherId, role: UserRole.TEACHER }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${teacherId}`, 404);
        }

        const course = await this.courseRepository.findOneBy({ teacherId: teacherId, subjectId: subjectId, groupId: groupId });
        if (!course) {
            throw new AppError(`Преподаватель с id ${teacherId} не имеет доступа к предмету с id ${subjectId} в группе с id ${groupId}`, 403);
        }

        return course;
    }

    private static async checkLesson(lessonId: number) {
        const lesson = await this.lessonRepository.findOneBy({ id: lessonId });
        if (!lesson) {
            throw new AppError(`Не найден урок с id ${lessonId}`, 404);
        }

        return lesson;
    }

    private static checkLessonCourse(lesson: Lesson, course: Course) {
        if (lesson.courseId != course.id) {
            throw new AppError(`Урок с id ${lesson.id} не принадлежит курсу с id ${course.id}`, 400);
        }
    }

    private static async calculateLateMinutes(groupId: number, lesson: Lesson) {
        const now = new Date();

        const today = new Date().toISOString().split('T')[0];
        const lessonDate = lesson.date.substring(0, 10);

        if (lessonDate !== today) {
            throw new AppError('Автоматический расчёт опоздания возможен только для сегодняшнего урока', 400);
        }

        const currentTime = now.toTimeString().split(' ')[0];

        const lessonTiming = await this.lessonTimingsRepository.findOne({ where: { 
            startTime: LessThan(currentTime),
            endTime: MoreThan(currentTime)
        } });

        if (!lessonTiming) {
            throw new AppError('Невозможно автоматически рассчитать время опоздания во внеурочное время', 400);
        }

        const timetable = await this.timetableRepository.findOneBy({ lessonTimingsId: lessonTiming.id, groupId: groupId, dayOfWeek: now.getDay() });
        if (!timetable) {
            throw new AppError(`Невозможно автоматически рассчитать время опоздания, так как у группы с id ${groupId} нет урока в это время`, 400);
        }

        const [startHours, startMinutes] = lessonTiming.startTime.split(':').map(Number);
        const startTotalMinutes = startHours * 60 + startMinutes;
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        const diffMinutes = currentTotalMinutes - startTotalMinutes;

        
        return diffMinutes;
    }
}