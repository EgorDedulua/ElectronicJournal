import { AppDataSource } from "@/config/data-source";
import { CourseDTO } from "@/dto/courseDTO";
import { Course } from "@/entities/course";
import { Group } from "@/entities/group";
import { User, UserRole } from "@/entities/user";
import { AppError } from "@/utils/appError";
import { Subject } from "@/entities/subject";
import { CoursesQueryDTO } from "@/dto/queries/coursesQueryDTO";

export class CourseService {
    private static courseRepository = AppDataSource.getRepository(Course);
    private static userRepository = AppDataSource.getRepository(User);
    private static groupRepository = AppDataSource.getRepository(Group);
    private static subjectRepository = AppDataSource.getRepository(Subject);

    private static async checkCourseData(dto: CourseDTO) {
        const teacher = await this.userRepository.findOneBy({ id: dto.teacherId, role: UserRole.TEACHER });
        if (!teacher) {
            throw new AppError(`Не найден учитель с id ${dto.teacherId}`, 404);
        }

        const group = await this.groupRepository.findOneBy({ id: dto.groupId });
        if (!group) {
            throw new AppError(`Не найдена группа с id ${dto.groupId}`, 404);
        }

        const subject = await this.subjectRepository.findOneBy({ id: dto.subjectId });
        if (!subject) {
            throw new AppError(`Не найден предмет с id ${dto.subjectId}`, 404);
        }
    }

    public static async getCourses(dto: CoursesQueryDTO) {
        const query = this.courseRepository.createQueryBuilder('course');
        query.leftJoinAndSelect('course.teacher', 'teacher');
        query.leftJoinAndSelect('course.group', 'group');
        query.leftJoinAndSelect('course.subject', 'subject');

        if (dto.searchString) {
            query.andWhere('teacher.fullName ILIKE :search', { search: `%${dto.searchString}%` });
        }

        if (dto.groupIds && dto.groupIds.length > 0) {
            query.andWhere('course.groupId IN (:...groupIds)', { groupIds: dto.groupIds });
        }

        if (dto.subjectIds && dto.subjectIds.length > 0) {
            query.andWhere('course.subjectId IN (:...subjectIds)', { subjectIds: dto.subjectIds });
        }

        const page = dto.page || 1;
        const pageSize = dto.pageSize || 50;
        query.skip((page - 1) * pageSize).take(pageSize);

        const sort = dto.sort || 'ASC';
        query.orderBy('group.name', sort).addOrderBy('subject.name', sort).addOrderBy('teacher.fullName', sort);

        const [courses, total] = await query.getManyAndCount();

        const data = courses.map(course => ({
            id: course.id,
            groupId: course.groupId,
            subjectId: course.subjectId,
            teacherId: course.teacherId,
            teacherName: course.teacher.fullName,
            groupName: course.group.name,
            subjectName: course.subject.name
        }));

        return {
            data: data,
            meta: {
                page: page,
                pageSize: pageSize,
                total: total,
                totalPages: Math.ceil(total / pageSize)
            }
        };
    }

    public static async addCourse(dto: CourseDTO) {
        await this.checkCourseData(dto);
        const exisitng = await this.courseRepository.findOneBy({ groupId: dto.groupId, teacherId: dto.teacherId, subjectId: dto.subjectId });
        if (exisitng) {
            throw new AppError(`Преподаватель с id ${dto.teacherId} уже ведет предмет с id ${dto.subjectId} в группе с id ${dto.groupId}`, 409);
        }

        const newCourse = this.courseRepository.create({
            groupId: dto.groupId,
            subjectId: dto.subjectId,
            teacherId: dto.teacherId
        });
        await this.courseRepository.save(newCourse);

        const course = await this.courseRepository.findOne({
            where: { id: newCourse.id },
            relations: ['teacher', 'group', 'subject']
        });

        if (!course) {
            throw new AppError('Ошибка при загрузке созданного курса', 500);
        }
        
        return {
            data: { 
                id: course.id, 
                groupId: course.groupId, 
                subjectId: course.subjectId, 
                teacherId: course.teacherId,
                teacherName: course.teacher.fullName,
                subjectName: course.subject.name,
                groupName: course.group.name
            }
        };
    }

    public static async deleteCourse(id: number) {
        const existing = await this.courseRepository.findOneBy({ id: id });
        if (!existing) {
            throw new AppError(`Не найдена связь группы, предмета и преподавателя с id ${id}`, 404);
        }

        await this.courseRepository.delete({ id: id });
    }

    public static async updateCourse(id: number, dto: CourseDTO) {
        const existing = await this.courseRepository.findOneBy({ id: id });
        if (!existing) {
            throw new AppError(`Не найдена связь группы, предмета и преподавателя с id ${id}`, 404);
        }

        const courseWithSameData = await this.courseRepository.findOneBy({ groupId: dto.groupId, teacherId: dto.teacherId, subjectId: dto.subjectId });
        if (courseWithSameData && courseWithSameData.id !== existing.id) {
            throw new AppError(`Преподаватель с id ${dto.teacherId} уже ведет предмет с id ${dto.subjectId} в группе с id ${dto.groupId}`, 409);
        }

        await this.checkCourseData(dto);
        existing.groupId = dto.groupId;
        existing.subjectId = dto.subjectId;
        existing.teacherId = dto.teacherId;

        await this.courseRepository.save(existing);

        const course = await this.courseRepository.findOne({
            where: { id: existing.id },
            relations: ['teacher', 'group', 'subject']
        });

        if (!course) {
            throw new AppError('Ошибка при загрузке обновленного курса', 500);
        }

        return {
            data: { 
                id: course.id, 
                groupId: course.groupId, 
                subjectId: course.subjectId,
                teacherId: course.teacherId,
                teacherName: course.teacher.fullName,
                subjectName: course.subject.name,
                groupName: course.group.name
            }
        };
    }
}