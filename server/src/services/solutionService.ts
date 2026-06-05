import { AppDataSource } from "@/config/data-source";
import { Course } from "@/entities/course";
import { Lesson } from "@/entities/lesson";
import { Solution } from "@/entities/solution";
import { SolutionFile } from "@/entities/solutionFile";
import { User, UserRole } from "@/entities/user";
import { Work } from "@/entities/work";
import { AppError } from "@/utils/appError";
import { EntityManager } from "typeorm";
import path from 'path';
import fs from 'fs/promises';

export class SolutionService {
    private static solutionRepository = AppDataSource.getRepository(Solution);
    private static userRepository = AppDataSource.getRepository(User);
    private static courseRepository = AppDataSource.getRepository(Course);
    private static lessonRepository = AppDataSource.getRepository(Lesson);
    private static workRepository = AppDataSource.getRepository(Work);

    public static async get(userId: number, role: UserRole, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, solutionId: number) {
        const course = await this.checkCourseAccess(userId, groupId, subjectId, role);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        const solution = await this.checkSolutionAndWork(workId, solutionId, userId, lessonId, role);
        return this.getReturningData(solution, solution.files);
    }

    public static async create(studentId: number, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, files: Express.Multer.File[] | undefined) {
        const course = await this.checkCourseAccess(studentId, groupId, subjectId, UserRole.STUDENT);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        const work = await this.workRepository.findOneBy({ id: workId });
        if (!work) {
            throw new AppError(`Не найдена работа с id ${workId}`, 404);
        }

        if (work.lessonId !== lessonId) {
            throw new AppError(`Работа с id ${workId} не принадлежит уроку с id ${lessonId}`, 400);
        }

        if (await this.solutionRepository.findOneBy( { workId: workId, studentId: studentId })) {
            throw new AppError(`У студента с id ${studentId} уже есть решение для работы с id ${workId}`, 409);
        }

        return await AppDataSource.transaction(async (manager) => {
            const solutionRepo = manager.getRepository(Solution);
            const solutionFilesRepo = manager.getRepository(SolutionFile);

            const newSolution = solutionRepo.create({
                workId: workId,
                studentId: studentId,
            });
            await solutionRepo.save(newSolution);

            let fileRecords: SolutionFile[] = [];
            if (files && files.length > 0) {
                fileRecords = files.map(f => 
                    solutionFilesRepo.create({
                        originalName: f.originalname,
                        storedName: f.filename,
                        mimetype: f.mimetype,
                        size: f.size,
                        solutionId: newSolution.id
                    })
                );
                await solutionFilesRepo.save(fileRecords);
            }

            const createdSolution = await solutionRepo.findOne({
                where: { id: newSolution.id },
                relations: ['student']
            });

            return this.getReturningData(createdSolution!, fileRecords);
        });
    }

    public static async update(studentId: number, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, solutionId: number, deleteFileIds: number[] | undefined, newFiles: Express.Multer.File[] | undefined) {
        const course = await this.checkCourseAccess(studentId, groupId, subjectId, UserRole.STUDENT);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        return await AppDataSource.transaction(async (manager) => {
            const solutionRepo = manager.getRepository(Solution);
            const solutionFileRepo = manager.getRepository(SolutionFile);
            const solution = await this.checkSolutionAndWork(workId, solutionId, studentId, lessonId, UserRole.STUDENT, manager);

            let filesChanged = false;

            if (deleteFileIds && deleteFileIds.length > 0) {
                const solutionsDir = path.resolve(process.cwd(), 'uploads/solutions/');

                const filesToRemove = solution.files.filter(f => deleteFileIds.includes(f.id));
                for (const file of filesToRemove) {
                    const absolutePath = path.join(solutionsDir, file.storedName);
                    try {
                        await fs.unlink(absolutePath);
                    } catch (err) {
                        console.error(`Ошибка удаления файла ${absolutePath}:`, err);
                    }
                    await solutionFileRepo.remove(file);
                }
                filesChanged = true;
            }

            if (newFiles && newFiles.length > 0) {
                const fileRecords = newFiles.map(f => 
                    solutionFileRepo.create({
                        originalName: f.originalname,
                        storedName: f.filename,
                        mimetype: f.mimetype,
                        size: f.size,
                        solutionId: solutionId
                    })
                );

                await solutionFileRepo.save(fileRecords);
                filesChanged = true;
            }

            if (filesChanged) {
                await solutionRepo.update({ id: solution.id }, { updatedAt: new Date() });
            }

            const updatedSolution = await solutionRepo.findOne({
                where: { id: solution.id },
                relations: ['files', 'student']
            });
            return this.getReturningData(updatedSolution!, updatedSolution!.files);
        });
    }

    public static async delete(studentId: number, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, solutionId: number) {
        const course = await this.checkCourseAccess(studentId, groupId, subjectId, UserRole.STUDENT);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        return await AppDataSource.transaction(async (manager) => {
            const solutionRepo = manager.getRepository(Solution);
            const solutionFileRepo = manager.getRepository(SolutionFile);
            const solution = await this.checkSolutionAndWork(workId, solutionId, studentId, lessonId, UserRole.STUDENT, manager);

            const solutionsDir = path.join(process.cwd(), 'uploads/solutions/');

            for (const file of solution.files) {
                const absolutePath = path.join(solutionsDir, file.storedName);
                try {
                    await fs.unlink(absolutePath);
                } catch (err) {
                    console.error(`Ошибка удаления файла ${absolutePath}:`, err);
                }
                await solutionFileRepo.remove(file);
            }

            await solutionRepo.remove(solution);
        });
    }

    private static getReturningData(solution: Solution, files: SolutionFile[] | null) {
        const data = {
            id: solution.id,
            studentId: solution.student.id,
            studentName: solution.student.fullName,
            workId: solution.workId,
            createdAt: solution.createdAt,
            updatedAt: solution.updatedAt,
            files: files
        };

        return data;
    }

    private static async checkCourseAccess(userId: number, groupId: number | null | undefined, subjectId: number, role: UserRole) {
        if (!groupId) {
            throw new AppError('Не указана группа', 400);
        }

        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new AppError(`Пользователь с id ${userId} не найден`, 404);
        }

        if (role === UserRole.STUDENT) {
            if (user.role !== UserRole.STUDENT || user.groupId !== groupId) {
                throw new AppError(`Студент не принадлежит группе ${groupId}`, 403);
            }
        } else if (role === UserRole.TEACHER) {
            const course = await this.courseRepository.findOneBy({
                teacherId: userId,
                groupId,
                subjectId,
            });

            if (!course) {
                throw new AppError(`Преподаватель не ведёт этот предмет в группе`, 403);
            }
        } else {
            throw new AppError('Недоступная роль', 403);
        }

        const course = await this.courseRepository.findOneBy({ groupId, subjectId });
        if (!course) {
            throw new AppError(`Предмет с id ${subjectId} не ведётся у группы с id ${groupId}`, 400);
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

    private static async checkSolutionAndWork(workId: number, solutionId: number, userId: number, lessonId: number, role: UserRole, manager?: EntityManager) {
        const workRepo = manager ? manager.getRepository(Work) : this.workRepository;
        const solutionRepo = manager ? manager.getRepository(Solution) : this.solutionRepository;

        const work = await workRepo.findOneBy({ id: workId });
        if (!work) {
            throw new AppError(`Не найдена работа с id ${workId}`, 404);
        }

        if (work.lessonId !== lessonId) {
            throw new AppError(`Работа с id ${workId} не принадлежит уроку с id ${lessonId}`, 400);
        }

        const solution = await solutionRepo.findOne({
            where: { id: solutionId },
            relations: ['files', 'student'],
        });
        if (!solution) {
            throw new AppError(`Решение с id ${solutionId} не найдено`, 404);
        }

        if (solution.workId !== workId) {
            throw new AppError(`Решение с id ${solutionId} не принадлежит работе с id ${workId}`, 400);
        }

        if (role === UserRole.STUDENT && solution.studentId !== userId) {
            throw new AppError(`Решение с id ${solutionId} не принадлежит студенту с id ${userId}`, 403);
        }

        return solution;
    }
}