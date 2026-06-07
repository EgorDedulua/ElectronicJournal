import { AppDataSource } from "@/config/data-source";
import { WorkDTO } from "@/dto/workDTO";
import { Course } from "@/entities/course";
import { Lesson } from "@/entities/lesson";
import { User, UserRole } from "@/entities/user";
import { Work } from "@/entities/work";
import { WorkFile } from "@/entities/workFile";
import { AppError } from "@/utils/appError";
import { UpdateWorkDTO } from "@/dto/updateWorkDTO";
import path from 'path';
import fs from 'fs/promises';
import { Solution } from "@/entities/solution";

export class WorkService {
    private static courseRepository = AppDataSource.getRepository(Course);
    private static userRepository = AppDataSource.getRepository(User);
    private static lessonRepository = AppDataSource.getRepository(Lesson);
    private static workRepository = AppDataSource.getRepository(Work);
    private static solutionRepository = AppDataSource.getRepository(Solution);

    public static async get(userId: number, role: UserRole, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number) {
        const { user, course } = await this.checkCourseAccess(userId, groupId, subjectId, role);
        
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        const work = await this.workRepository.findOne({
            where: { id: workId },
            relations: ['files']
        });

        if (!work) { 
            throw new AppError(`Работа с id ${workId} не найдена`, 404);
        }

        if (work.lessonId !== lesson.id) {
            throw new AppError(`Работа не принадлежит указанному уроку`, 400);
        }

        return await this.getReturningData(work, work.files, user);
    }

    public static async create(teacherId: number, subjectId: number, groupId: number, lessonId: number, dto: WorkDTO, files: Express.Multer.File[] | undefined) {
        const { course, user } = await this.checkCourseAccess(teacherId, groupId, subjectId, UserRole.TEACHER);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        if (await this.workRepository.findOneBy({ lessonId })) {
            throw new AppError(`На уроке с id ${lessonId} уже есть работа`, 409);
        }

        return await AppDataSource.transaction(async (manager) => {
            const workRepo = manager.getRepository(Work);
            const workFileRepo = manager.getRepository(WorkFile);

            const newWork = workRepo.create({
                title: dto.title,
                description: dto.description,
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                lessonId
            });
            await workRepo.save(newWork);

            let fileRecords: WorkFile[] = [];
            if (files && files.length > 0) {
                fileRecords = files.map(f =>
                    workFileRepo.create({
                        originalName: f.originalname,
                        storedName: f.filename,
                        mimetype: f.mimetype,
                        size: f.size,
                        workId: newWork.id
                    })
                );
                await workFileRepo.save(fileRecords);
            }

            return await this.getReturningData(newWork, fileRecords, user);
        });
    }

    public static async update(teacherId: number, subjectId: number, groupId: number, lessonId: number, workId: number, dto: UpdateWorkDTO, newFiles?: Express.Multer.File[]) {
        const { course, user } = await this.checkCourseAccess(teacherId, groupId, subjectId, UserRole.TEACHER);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        return await AppDataSource.transaction(async (manager) => {
            const workRepo = manager.getRepository(Work);
            const workFileRepo = manager.getRepository(WorkFile);

            const work = await workRepo.findOne({ where: { id: workId }, relations: ['files'] });
            if (!work) {
                throw new AppError(`Работа с id ${workId} не найдена`, 404);
            }
            if (work.lessonId !== lesson.id) {
                throw new AppError(`Работа не принадлежит указанному уроку`, 400);
            }

            work.description = dto.description ?? work.description;
            work.title = dto.title ?? work.title;
            work.deadline = dto.deadline ? new Date(dto.deadline) : work.deadline;

            const deleteFileIds = dto.deleteFileIds && dto.deleteFileIds.length > 0 ? dto.deleteFileIds : [];
            if (deleteFileIds.length > 0) {
                const worksDir = path.resolve(process.cwd(), 'uploads/works/');
                const filesToRemove = work.files.filter(f => deleteFileIds.includes(f.id));
                work.files = work.files.filter(f => !deleteFileIds.includes(f.id));
                for (const file of filesToRemove) {
                    const absolutePath = path.join(worksDir, file.storedName);
                    try {
                        await fs.unlink(absolutePath);
                    } catch (err) {
                        console.error(`Ошибка удаления файла ${absolutePath}:`, err);
                    }
                    await workFileRepo.remove(file);
                }
            }

            const updatedWorkFields: Partial<Work> = {};
            if (dto.title !== undefined) updatedWorkFields.title = work.title;
            if (dto.description !== undefined) updatedWorkFields.description = work.description;
            if (dto.deadline !== undefined) updatedWorkFields.deadline = work.deadline;
            if (deleteFileIds.length > 0 || (newFiles && newFiles.length > 0)) {
                updatedWorkFields.updatedAt = new Date();
            }

            if (Object.keys(updatedWorkFields).length > 0) {
                await workRepo.update({ id: work.id }, updatedWorkFields);
            }

            if (newFiles && newFiles.length > 0) {
                const fileRecords = newFiles.map(f =>
                    workFileRepo.create({
                        originalName: f.originalname,
                        storedName: f.filename,
                        mimetype: f.mimetype,
                        size: f.size,
                        workId: work.id
                    })
                );
                await workFileRepo.save(fileRecords);
            }

            const updatedWork = await workRepo.findOne({ where: { id: workId }, relations: ['files'] });
            return await this.getReturningData(updatedWork!, updatedWork!.files, user);
        });
    }

    public static async delete(teacherId: number, subjectId: number, groupId: number, lessonId: number, workId: number) {
        const { course } = await this.checkCourseAccess(teacherId, groupId, subjectId, UserRole.TEACHER);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        return await AppDataSource.transaction(async (manager) => {
            const workRepo = manager.getRepository(Work);
            const workFileRepo = manager.getRepository(WorkFile);

            const work = await workRepo.findOne({ where: { id: workId }, relations: ['files'] });
            if (!work) {
                throw new AppError(`Работа с id ${workId} не найдена`, 404);
            }
            if (work.lessonId !== lesson.id) {
                throw new AppError(`Работа не принадлежит указанному уроку`, 400);
            }

            const worksDir = path.resolve(process.cwd(), 'uploads/works/');
            for (const file of work.files) {
                const absolutePath = path.join(worksDir, file.storedName);
                try { 
                    await fs.unlink(absolutePath); 
                } catch (err) { 
                    console.error(`Ошибка удаления файла ${absolutePath}:`, err); 
                }
                await workFileRepo.remove(file);
            }
            await workRepo.remove(work);
        });
    }

    private static async checkCourseAccess(userId: number, groupId: number | null | undefined, subjectId: number, role: UserRole) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new AppError(`Пользователь с id ${userId} не найден`, 404);
        }

        if (!groupId) {
            throw new AppError('не задана группа', 400);
        }

        if (role === UserRole.STUDENT) {
            if (user.role !== UserRole.STUDENT || user.groupId !== groupId) {
                throw new AppError('Студент не принадлежит указанной группе', 403);
            }
        } else if (role === UserRole.TEACHER) {
            const course = await this.courseRepository.findOneBy({ teacherId: userId, groupId, subjectId });
            if (!course) {
                throw new AppError('Преподаватель не ведёт данный предмет в этой группе', 403);
            }
        } else {
            throw new AppError('Недопустимая роль', 403);
        }

        const course = await this.courseRepository.findOneBy({ groupId, subjectId });
        if (!course) {
            throw new AppError(`Предмет с id ${subjectId} не ведётся у группы с id ${groupId}`, 400);
        }

        return { user, course };
    }

    private static async getReturningData(work: Work, files: WorkFile[] | null, user: User) {
        const data: any = {
            id: work.id,
            title: work.title,
            description: work.description,
            deadline: work.deadline,
            lessonId: work.lessonId,
            createdAt: work.createdAt,
            updatedAt: work.updatedAt,
            files: files
        };

        if (user.role === UserRole.STUDENT) {
            const solution = await this.solutionRepository.findOneBy({ studentId: user.id, workId: work.id });
            data.solutionId = solution?.id ?? null;
        } else if (user.role === UserRole.TEACHER) {
            const solutions = await this.solutionRepository.find({
                where: { workId: work.id },
                relations: ['student']
            });
            data.solutions = solutions
                .map(s => ({
                    id: s.id,
                    studentName: s.student.fullName,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt ?? null,
                }))
                .sort((a, b) =>
                    a.studentName.localeCompare(b.studentName, 'ru', { sensitivity: 'base' })
                );
        }

        return data;
    }

    private static async checkLesson(lessonId: number) {
        const lesson = await this.lessonRepository.findOneBy({ id: lessonId });
        if (!lesson) throw new AppError(`Урок с id ${lessonId} не найден`, 404);
        return lesson;
    }

    private static checkLessonCourse(lesson: Lesson, course: Course) {
        if (lesson.courseId != course.id) {
            throw new AppError(`Урок с id ${lesson.id} не принадлежит курсу с id ${course.id}`, 400);
        }
    }
}