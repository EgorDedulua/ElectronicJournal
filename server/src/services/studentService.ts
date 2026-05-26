import { AppDataSource } from "@/config/data-source"
import { Course } from "@/entities/course";
import { Lesson } from "@/entities/lesson";
import { User } from "@/entities/user"
import { AppError } from "@/utils/appError";
import { Subject } from "@/entities/subject";
import { Mark } from "@/entities/mark";
import { Absence } from "@/entities/absence";
import { Late } from "@/entities/late";
import { Credit } from "@/entities/credit";

export class StudentService {
    private static userRepository = AppDataSource.getRepository(User);
    private static subjectRepository = AppDataSource.getRepository(Subject);
    private static lessonRepository = AppDataSource.getRepository(Lesson);
    private static markRepository = AppDataSource.getRepository(Mark);
    private static absenceRepository = AppDataSource.getRepository(Absence);
    private static lateRepository = AppDataSource.getRepository(Late);
    private static creditRepository = AppDataSource.getRepository(Credit);
    private static courseRepository = AppDataSource.getRepository(Course);

    public static async getSubjects(userId: number) {
        const user = await this.checkUserAndGroup(userId);

        const subjects = await this.subjectRepository
            .createQueryBuilder('subject')
            .innerJoin(Course, 'course', 'course.subjectId = subject.Id')
            .where('course.groupId = :groupId', { groupId: user.groupId })
            .distinct(true)
            .getMany();
        
        return { data: subjects};
    }


    public static async getLessons(userId: number, subjectId: number) {
        const user = await this.checkUserAndGroup(userId);
        await this.checkCourse(user, subjectId);

        const lessons = await this.lessonRepository
            .createQueryBuilder('lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.groupId = :groupId', { groupId: user.groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: lessons };
    }

    public static async getMarks(userId: number, subjectId: number) {
        const user = await this.checkUserAndGroup(userId);
        await this.checkCourse(user, subjectId);

        const marks = await this.markRepository
            .createQueryBuilder('mark')
            .innerJoin('mark.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.groupId = :groupId', { groupId: user.groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .andWhere('mark.studentId = :studentId', { studentId: userId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: marks };
    }

    public static async getAbsences(userId: number, subjectId: number) {
        const user = await this.checkUserAndGroup(userId);
        await this.checkCourse(user, subjectId);
        
        const absences = await this.absenceRepository
            .createQueryBuilder('absence')
            .innerJoin('absence.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.groupId = :groupId', { groupId: user.groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .andWhere('absence.studentId = :studentId', { studentId: userId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: absences };
    }

    public static async getLates(userId: number, subjectId: number) {
        const user = await this.checkUserAndGroup(userId);
        await this.checkCourse(user, subjectId);

        const lates = await this.lateRepository
            .createQueryBuilder('late')
            .innerJoin('late.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.groupId = :groupId', { groupId: user.groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .andWhere('late.studentId = :studentId', { studentId: userId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: lates };
    }

    public static async getCredits(userId: number, subjectId: number) {
        const user = await this.checkUserAndGroup(userId);
        await this.checkCourse(user, subjectId);

        const credits = await this.creditRepository
            .createQueryBuilder('credit')
            .innerJoin('credit.lesson', 'lesson')
            .innerJoin('lesson.course', 'course')
            .where('course.groupId = :groupId', { groupId: user.groupId })
            .andWhere('course.subjectId = :subjectId', { subjectId: subjectId })
            .andWhere('credit.studentId = :studentId', { studentId: userId })
            .orderBy('lesson.date', 'ASC')
            .getMany();
        
        return { data: credits };
    }

    private static async checkUserAndGroup(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['group'] });
        if (!user) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        if (!user.group) {
            throw new AppError('У пользователя нет группы', 400);
        }

        return user;
    }

    private static async checkCourse(user: User, subjectId: number) {
        const course = await this.courseRepository.findOne({
            where: { groupId: user.group!.id, subjectId }
        });

        if (!course) {
            throw new AppError('Предмет не найден в расписании студента', 404);
        }
    }
}