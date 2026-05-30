import { AppDataSource } from "@/config/data-source";
import { CommentDTO } from "@/dto/commentDTO";
import { CommentsQueryDTO } from "@/dto/queries/commentsQueryDTO";
import { Course } from "@/entities/course";
import { Lesson } from "@/entities/lesson";
import { User, UserRole } from "@/entities/user";
import { Work } from "@/entities/work";
import { WorkComment } from "@/entities/workComment";
import { AppError } from "@/utils/appError";

export class WorkCommentsService {
    private static userRepository = AppDataSource.getRepository(User);
    private static courseRepository = AppDataSource.getRepository(Course);
    private static workRepository = AppDataSource.getRepository(Work);
    private static lessonRepository = AppDataSource.getRepository(Lesson);
    private static commentRepository = AppDataSource.getRepository(WorkComment);

    public static async get(userId: number, subjectId: number, groupId: number, lessonId: number, workId: number, dto: CommentsQueryDTO) {
        const { course} = await this.checkUserAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        const work = await this.workRepository.findOneBy({ id: workId });
        if (!work) {
            throw new AppError(`Не найдена работа с id ${workId}`, 404);
        }

        const comments = await this.commentRepository.find({
            where: { workId: workId },
            relations: ['author', 'parent', 'parent.author'],
            order: { createdAt: 'ASC' },
            skip: dto.offset,
            take: dto.limit + 1
        });

        const hasMore = comments.length > dto.limit;
        const items = hasMore ? comments.slice(0, dto.limit) : comments;

        const data = items.map(comment =>({
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
        }));

        return {
            data,
            hasMore,
            nextOffset: dto.offset + items.length
        };
    }

    public static async create(userId: number, subjectId: number, groupId: number, lessonId: number, workId: number, dto: CommentDTO) {
        const { course } = await this.checkUserAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        const work = await this.workRepository.findOneBy({ id: workId });
        if (!work) {
            throw new AppError(`Не найдена работа с id ${workId}`, 404);
        }

        if (dto.parentId) {
            const parent = await this.commentRepository.findOneBy({ id: dto.parentId, workId: workId });
            if (!parent) {
                throw new AppError(`Не найден родительский комментарий с id ${dto.parentId} под работой с id ${workId}`, 404);
            }
        }

        const newComment = this.commentRepository.create({
            authorId: userId,
            text: dto.text,
            parentId: dto.parentId,
            workId: workId
        });
        await this.commentRepository.save(newComment);

        const comment = await this.commentRepository.findOne({
            where: { id: newComment.id },
            relations: ['author', 'parent', 'parent.author']
        });

        return {
            data: {
                id: comment!.id,
                text: comment!.text,
                author: {
                    id: comment!.author.id,
                    fullName: comment!.author.fullName,
                    role: comment!.author.role,
                },
                parent: comment!.parent ? {
                    id: comment!.parent.id,
                    text: comment!.parent.text,
                    author: {
                        id: comment!.parent.author.id,
                        fullName: comment!.parent.author.fullName,
                        role: comment!.parent.author.role
                    }
                } : null,
                createdAt: comment!.createdAt,
            }
        }
    }

    public static async update(userId: number, subjectId: number, groupId: number, lessonId: number, workId: number, commentId: number, text: string) {
        const { course } = await this.checkUserAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        const work = await this.workRepository.findOneBy({ id: workId });
        if (!work) {
            throw new AppError(`Не найдена работа с id ${workId}`, 404);
        }

        const commentToUpdate = await this.commentRepository.findOneBy({ id: commentId, workId: workId });
        if (!commentToUpdate) {
            throw new AppError(`Не найден комментарий с id ${commentId} под работой с id ${workId}`, 404);
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

        return {
            data: {
                id: comment!.id,
                text: comment!.text,
                author: {
                    id: comment!.author.id,
                    fullName: comment!.author.fullName,
                    role: comment!.author.role,
                },
                parent: comment!.parent ? {
                    id: comment!.parent.id,
                    text: comment!.parent.text,
                    author: {
                        id: comment!.parent.author.id,
                        fullName: comment!.parent.author.fullName,
                        role: comment!.parent.author.role
                    }
                } : null,
                createdAt: comment!.createdAt,
                updatedAt: comment!.updatedAt
            }
        }
    }

    public static async delete(userId: number, subjectId: number, groupId: number, lessonId: number, workId: number, commentId: number) {
        const { course } = await this.checkUserAndCourse(userId, groupId, subjectId);
        const lesson = await this.checkLesson(lessonId);
        this.checkLessonCourse(lesson, course);

        const work = await this.workRepository.findOneBy({ id: workId });
        if (!work) {
            throw new AppError(`Не найдена работа с id ${workId}`, 404);
        }

        const commentToDelete = await this.commentRepository.findOneBy({ id: commentId, workId: workId });
        if (!commentToDelete) {
            throw new AppError(`Не найден комментарий с id ${commentId} под работой с id ${workId}`, 404);
        }

        if (commentToDelete.authorId !== userId) {
            throw new AppError('Нельзя удалить чужой комментарий', 403)
        }

        await this.commentRepository.delete(commentToDelete);
    }

    private static async checkUserAndCourse(userId: number, groupId: number, subjectId: number) {
        const user = await this.userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        const course = await this.courseRepository.findOneBy({ groupId: groupId, subjectId: subjectId });
        if (!course) {
            throw new AppError(`Предмет с id ${subjectId} не ведется у группы с id ${groupId}`, 400);
        }

        if (user.role === UserRole.TEACHER && course.teacherId !== userId) {
            throw new AppError(`Преподаватель с id ${userId} не ведет предмет с id ${subjectId} в группе с id ${groupId}`, 403);
        }

        if (user.role === UserRole.STUDENT && user.groupId !== groupId) {
            throw new AppError(`Студент с id ${userId} не учится в группе с id ${groupId}`, 403);
        }

        return { user, course };
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
