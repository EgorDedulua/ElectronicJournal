import { AppDataSource } from "@/config/data-source";
import { SolutionFile } from "@/entities/solutionFile";
import { User, UserRole } from "@/entities/user";
import { WorkFile } from "@/entities/workFile";
import { AppError } from "@/utils/appError";
import path from "path";
import fs from 'fs/promises';

export class FileService {
    private static workFilesRepository = AppDataSource.getRepository(WorkFile);
    private static solutionFilesRepository = AppDataSource.getRepository(SolutionFile);
    private static userRepository = AppDataSource.getRepository(User);

    public static async getWorkFile(userId: number, fileId: number) {
        const user = await this.checkUser(userId);
        const file = await this.workFilesRepository.findOne({
            where: { id: fileId },
            relations: ['work', 'work.lesson', 'work.lesson.course']
        });
        if (!file) {
            throw new AppError(`Не найден файл работы с id ${fileId}`, 404);
        }

        const course = file.work.lesson.course;
        if (user.role === UserRole.TEACHER) {
            if (course.teacherId !== userId) {
                throw new AppError(`Преподаватель с id ${userId} не имеет доступа к группе с id ${course.groupId} по предмету с id ${course.subjectId}`, 403);
            }
        } else if (user.role === UserRole.STUDENT) {
            if (!user.groupId || user.groupId !== course.groupId) {
                throw new AppError(`Студент с id ${userId} не имеет доступа к группе с id ${course.groupId}`, 403);
            }
        }

        const absolutePath = path.resolve(process.cwd(), 'uploads/works', file.storedName);
        try {
            await fs.access(absolutePath);
            return { absolutePath: absolutePath, originalName: file.originalName };
        } catch (err) {
            throw new AppError(`Файл с id ${fileId} не найден на сервере`, 404);
        }
    }
    
    public static async getSolutionFile(userId: number, fileId: number) {
        const user = await this.checkUser(userId);
        const file = await this.solutionFilesRepository.findOne({
            where: { id: fileId },
            relations: ['solution', 'solution.student', 'solution.work', 'solution.work.lesson', 'solution.work.lesson.course']
        });
        if (!file) {
            throw new AppError(`Не найден файл решения с id ${fileId}`, 404);
        }

        const course = file.solution.work.lesson.course;
        if (user.role === UserRole.TEACHER) {
            if (course.teacherId !== userId) {
                throw new AppError(`Преподаватель с id ${userId} не имеет доступа к группе с id ${course.groupId} по предмету с id ${course.subjectId}`, 403);
            }
        } else if (user.role === UserRole.STUDENT) {
            if (!user.groupId || user.groupId !== course.groupId) {
                throw new AppError(`Студент с id ${userId} не имеет доступа к группе с id ${course.groupId}`, 403);
            }

            if (file.solution.student.id !== userId) {
                throw new AppError(`Студент с id ${userId} не имеет доступа к файлу решения с id ${fileId}`, 403);
            }
        }

        const absolutePath = path.resolve(process.cwd(), 'uploads/solutions', file.storedName);
        try {
            await fs.access(absolutePath);
            return { absolutePath: absolutePath, originalName: file.originalName };
        } catch (err) {
            throw new AppError(`Файл с id ${fileId} не найден на сервере`, 404);
        }
    }

    private static async checkUser(userId: number) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        if (user.role !== UserRole.TEACHER && user.role !== UserRole.STUDENT) {
            throw new AppError('Скачивать файлы могут только студенты и преподаватели', 403);
        }

        return user;
    }
}