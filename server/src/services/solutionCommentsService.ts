import { AppDataSource } from "@/config/data-source";
import { CommentDTO } from "@/dto/commentDTO";
import { CommentsQueryDTO } from "@/dto/queries/commentsQueryDTO";
import { Course } from "@/entities/course";
import { Lesson } from "@/entities/lesson";
import { Solution } from "@/entities/solution";
import { SolutionComment } from "@/entities/solutionComment";
import { User, UserRole } from "@/entities/user";
import { Work } from "@/entities/work";
import { AppError } from "@/utils/appError";
import { EntityManager } from "typeorm";

export class SolutionCommentsService {
    private static userRepository = AppDataSource.getRepository(User);
    private static courseRepository = AppDataSource.getRepository(Course);
    private static lessonRepository = AppDataSource.getRepository(Lesson);
    private static commentRepository = AppDataSource.getRepository(SolutionComment);
    private static workRepository = AppDataSource.getRepository(Work);
    private static solutionRepository = AppDataSource.getRepository(Solution);

    public static async get(userId: number, role: UserRole, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, solutionId: number, dto: CommentsQueryDTO) {
        const course = await this.checkCourseAccess(userId, groupId, subjectId, role);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkSolutionAndWork(workId, solutionId, userId, lessonId, role);

        const comments = await this.commentRepository.find({
            where: { solutionId: solutionId },
            relations: ['parent', 'author', 'parent.author'],
            order: { createdAt: 'ASC'},
            skip: dto.offset,
            take: dto.limit! + 1
        });

        const hasMore = comments.length > dto.limit!;
        const items = hasMore ? comments.slice(0, dto.limit) : comments;

        const data = items.map(comment => this.formatComment(comment));

        return {
            data,
            hasMore,
            nextOffset: dto.offset! + items.length
        };
    }

    public static async create(userId: number, role: UserRole, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, solutionId: number, dto: CommentDTO) {
        const course = await this.checkCourseAccess(userId, groupId, subjectId, role);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkSolutionAndWork(workId, solutionId, userId, lessonId, role);

        if (dto.parentId) {
            const parent = await this.commentRepository.findOneBy({ id: dto.parentId, solutionId: solutionId });
            if (!parent) {
                throw new AppError(`Не найден родительский комментарий с id ${dto.parentId} под работой с id ${workId}`, 404);
            }
        }

        const newComment = this.commentRepository.create({
            authorId: userId,
            text: dto.text,
            parentId: dto.parentId,
            solutionId: solutionId
        });
        await this.commentRepository.save(newComment);

        const comment = await this.commentRepository.findOne({
            where: { id: newComment.id },
            relations: ['author', 'parent', 'parent.author']
        });

        return { data: this.formatComment(comment!) };
    }

    public static async update(userId: number, role: UserRole, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, solutionId: number, commentId: number, text: string) {
        const course = await this.checkCourseAccess(userId, groupId, subjectId, role);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkSolutionAndWork(workId, solutionId, userId, lessonId, role);

        const commentToUpdate = await this.commentRepository.findOneBy({ id: commentId, solutionId: solutionId });
        if (!commentToUpdate) {
            throw new AppError(`Не найден комментарий с id ${commentId} под решением с id ${solutionId}`, 404);
        }

        if (commentToUpdate.authorId !== userId) {
            throw new AppError('Нельзя редактировать чужой комментарий', 403)
        }

        commentToUpdate.text = text;
        await this.commentRepository.save(commentToUpdate);

        const comment = await this.commentRepository.findOne({
            where: { id: commentToUpdate.id },
            relations: ['author', 'parent', 'parent.author']
        });

        return { data: this.formatComment(comment!) };
    }

    public static async delete(userId: number, role: UserRole, subjectId: number, groupId: number | null | undefined, lessonId: number, workId: number, solutionId: number, commentId: number) {
        const course = await this.checkCourseAccess(userId, groupId, subjectId, role);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);
        await this.checkSolutionAndWork(workId, solutionId, userId, lessonId, role);

        const commentToDelete = await this.commentRepository.findOneBy({ id: commentId, solutionId: solutionId });
        if (!commentToDelete) {
            throw new AppError(`Не найден комментарий с id ${commentId} под решением с id ${solutionId}`, 404);
        }

        if (commentToDelete.authorId !== userId) {
            throw new AppError('Нельзя удалить чужой комментарий', 403)
        }

        await this.commentRepository.delete({ id: commentId });
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

    private static formatComment(comment: SolutionComment) {
        return {
                id: comment.id,
                text: comment.text,
                author: {
                    id: comment.author.id,
                    fullName: comment.author.fullName,
                    role: comment.author.role,
                },
                parent: comment.parent ? {
                    id: comment.parent.id,
                    text: comment.parent.text,
                    author: {
                        id: comment.parent.author.id,
                        fullName: comment.parent.author.fullName,
                        role: comment.parent.author.role
                    }
                } : null,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
        };
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
    }
}