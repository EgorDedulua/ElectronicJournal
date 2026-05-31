import { AppDataSource } from "@/config/data-source";
import { WorkDTO } from "@/dto/workDTO";
import { Course } from "@/entities/course";
import { Lesson } from "@/entities/lesson";
import { User, UserRole } from "@/entities/user";
import { Work } from "@/entities/work";
import { WorkFile } from "@/entities/workFile";
import { AppError } from "@/utils/appError";
import { WorkComment } from "@/entities/workComment";
import { Solution } from "@/entities/solution";
import { UpdateWorkDTO } from "@/dto/updateWorkDTO";
import path from 'path';
import fs from 'fs/promises';
import { isFileAccesible } from "@/utils/isFileAccesible";
import { Multer } from "multer";

export class WorkService {
    private static courseRepository = AppDataSource.getRepository(Course);
    private static userRepository = AppDataSource.getRepository(User);
    private static lessonRepository = AppDataSource.getRepository(Lesson);
    private static workRepository = AppDataSource.getRepository(Work);

    public static async create(teacherId: number, subjectId: number, groupId: number, lessonId: number, dto: WorkDTO, files: Express.Multer.File[] | undefined) {
        const course = await this.checkTeacherAndCourse(teacherId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        if (await this.workRepository.findOneBy({ lessonId: lessonId })) {
            throw new AppError(`На уроке с id ${lessonId} уже есть работа`, 409);
        }

        return await AppDataSource.transaction(async (manager) => {
            const workRepo = manager.getRepository(Work);
            const workFileRepo = manager.getRepository(WorkFile);

            const newWork = workRepo.create({
                title: dto.title,
                description: dto.description,
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                lessonId: lessonId
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

            return this.getReturningData(newWork, fileRecords);
        });
    }

    public static async get(userId: number, subjectId: number, lessonId: number, workId: number, groupId?: number | null) {
        if (!groupId) {
            throw new AppError('Id группы не задан', 400);
        }

        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        if (user.role !== UserRole.STUDENT && user.role !== UserRole.TEACHER) {
            throw new AppError('Получать информацию о работе могут только преподаватели и студенты', 403);
        }

        if (user.role === UserRole.STUDENT) {
            if (!groupId || user.groupId !== groupId) {
                throw new AppError(`У студента с id ${user.id} нет доступа к группе с id ${groupId}`, 403);
            }
        }

        const course = await this.courseRepository.findOneBy({ subjectId: subjectId, groupId: groupId });
        if (!course) {
            throw new AppError(`Предмет с id ${subjectId} не ведется у группы с id ${groupId}`, 400);
        }

        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        if (user.role === UserRole.TEACHER && course.teacherId !== user.id) {
            throw new AppError(`У преподавателя с id ${user.id} нет доступа к работе с id ${workId}`, 403);
        }
        
        const work = await this.workRepository.findOne({ 
            where: { id: workId }, 
            relations: {
                files: true,
                comments: true,
                solutions: user.role === UserRole.TEACHER
            }
        });

        if (!work) {
            throw new AppError(`Не найдена работа с id ${workId}`, 404);
        }

        if (work.lessonId !== lesson.id) {
            throw new AppError(`Работа с id ${workId} не принадлежит уроку с id ${lesson.id}`, 400);
        }

        return this.getReturningData(work, work.files, work.comments, work.solutions);
    }

    public static async update(teacherId: number, subjectId: number, groupId: number, lessonId: number, workId: number, dto: UpdateWorkDTO, newFiles?: Express.Multer.File[]) {
        const course = await this.checkTeacherAndCourse(teacherId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        return await AppDataSource.transaction(async (manager) => {
            const workRepo = manager.getRepository(Work);
            const workFileRepo = manager.getRepository(WorkFile);

            const work = await workRepo.findOne({ where: { id: workId }, relations: ['files'] });

            if (!work) {
                throw new AppError(`Не найдена работа с id ${workId}`, 404);
            }

            if (work.lessonId !== lesson.id) {
                throw new AppError(`Работа с id ${workId} не принадлежит уроку с id ${lesson.id}`, 400);
            }

            work.description = dto.description ?? work.description;
            work.title = dto.title ?? work.title;
            work.deadline = dto.deadline ? new Date(dto.deadline) : work.deadline;

            if (dto.deleteFileIds && dto.deleteFileIds.length > 0) {
                const worksDir = path.resolve(__dirname, '../../uploads/works');
                
                const filesToRemove = work.files.filter(f => dto.deleteFileIds!.includes(f.id));
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

            if (newFiles && newFiles.length > 0) {
                const fileRecords = newFiles.map(f =>
                    workFileRepo.create({
                        originalName: f.originalname,
                        storedName: f.filename,
                        mimetype: f.mimetype,
                        size: f.size,
                        workId: workId
                    })
                );

                await workFileRepo.save(fileRecords);
            }

            await workRepo.update(workId, {
                title: work.title,
                description: work.description,
                deadline: work.deadline
            });
            
            const updatedWork = await workRepo.findOne({
                where: { id: workId },
                relations: ['files', 'comments', 'solutions' ]
            });
            return this.getReturningData(updatedWork!, updatedWork!.files, updatedWork!.comments, updatedWork!.solutions);
        });
    }

    public static async delete(teacherId: number, subjectId: number, groupId: number, lessonId: number, workId: number) {
        const course = await this.checkTeacherAndCourse(teacherId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        return await AppDataSource.transaction(async (manager) => {
            const workRepo = manager.getRepository(Work);
            const workFileRepo = manager.getRepository(WorkFile);

            const work = await workRepo.findOne({
                where: { id: workId },
                relations: ['files']
            });

            if (!work) {
                throw new AppError(`Не найдена работа с id ${workId}`, 404);
            }

            if (work.lessonId !== lesson.id) {
                throw new AppError(`Работа с id ${workId} не принадлежит уроку с id ${lesson.id}`, 400);
            }

            const worksDir = path.resolve(__dirname, '../../uploads/works');

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

    private static getReturningData(work: Work, files: WorkFile[] | null = null, comments: WorkComment[] | null = null, solutions: Solution[] | null = null) {
        const data = {
            id: work.id,
            title: work.title,
            description: work.description,
            deadline: work.deadline,
            lessonId: work.lessonId,
            createdAt: work.createdAt,
            updatedAt: work.updatedAt,
            files: files
        };

        return data;
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
}