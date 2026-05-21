import { AppDataSource } from "@/config/data-source";
import { User, UserRole } from "@/entities/user";
import { RegisterDTO } from "@/dto/registerDTO";
import { AppError } from "@/utils/appError";
import { hash } from "bcryptjs";
import { Group } from "@/entities/group";
import { SubjectDTO } from "@/dto/subjectDTO";
import { GroupDTO } from "@/dto/groupDTO";
import { Subject } from "@/entities/subject";
import { UsersQueryDTO } from "@/dto/queries/usersQueryDTO";
import { Brackets, } from "typeorm";
import { SubjectsQueryDTO } from "@/dto/queries/subjectsQueryDTO";
import { GroupsQueryDTO } from "@/dto/queries/groupsQueryDTO";

export class AdminService {
    private static userRepository = AppDataSource.getRepository(User);
    private static groupRepository = AppDataSource.getRepository(Group);
    private static subjectRepository = AppDataSource.getRepository(Subject);

    public static async getUsers(dto: UsersQueryDTO) {
        const query = this.userRepository.createQueryBuilder('user');
        query.leftJoinAndSelect('user.group', 'group');

        if (dto.searchString) {
            query.andWhere(
                new Brackets(qb => {
                    qb.where('user.fullName ILIKE :search', { search: `%${dto.searchString}%`})
                    .orWhere('user.login ILIKE :search', { search: `%${dto.searchString}%`})
                })
            );
        }
        
        if (dto.role) {
            query.andWhere('user.role = :role', { role: dto.role });
        }

        if (dto.groupIds && dto.groupIds.length > 0) {
            query.andWhere('user.groupId IN (:...groupIds)', { groupIds: dto.groupIds });
        }

        const page = dto.page || 1;
        const pageSize = dto.pageSize || 50;
        query.skip((page - 1) * pageSize).take(pageSize);

        const sort = dto.sort || 'ASC';
        query.orderBy('user.fullName', sort);

        const[users, total] = await query.getManyAndCount();

        const data = users.map(user => ({
            id: user.id,
            login: user.login,
            fullName: user.fullName,
            role: user.role,
            groupId: user.groupId,
            groupName: user.group ? user.group.name : null
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

    public static async registerUser(dto: RegisterDTO) {
        const existing = await this.userRepository.findOneBy({ login: dto.login });
        if (existing) {
            throw new AppError(`Логин ${dto.login} уже занят`, 409);
        }

        if (dto.groupId) {
            const group = await this.groupRepository.findOneBy({ id: dto.groupId });
            if (!group) {
                throw new AppError(`Не найдена группа с id ${dto.groupId}`, 404);
            }
        }

        const passwordHash = await hash(dto.password!, 10);
        const newUser = this.userRepository.create({
            login: dto.login,
            passwordHash,
            fullName: dto.fullName,
            groupId: dto.groupId,
            role: dto.role as UserRole
        });
        await this.userRepository.save(newUser);

        const savedUser = await this.userRepository.findOne({
            where: { id: newUser.id },
            relations: ['group']
        });

        return {
            data: { id: newUser.id, fullName: newUser.fullName, role: newUser.role, login: newUser.login, groupName: savedUser!.group?.name, groupId: newUser.groupId }
        };
    }

    public static async deleteUser(userId: number) {
        const existing = await this.userRepository.findOneBy({ id: userId });
        if (!existing) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        await this.userRepository.delete({ id: userId });
    }

    public static async updateUser(userId: number, dto: RegisterDTO) {
        const existing = await this.userRepository.findOneBy({ id: userId });
        if (!existing) {
            throw new AppError(`Не найден пользователь с id ${userId}`, 404);
        }

        if (dto.login !== existing.login && await this.userRepository.findOneBy({ login: dto.login })) {
            throw new AppError(`Логин ${dto.login} уже занят`, 409);
        }

        if (dto.groupId) {
            const group = await this.groupRepository.findOneBy({ id: dto.groupId });
            if (!group) {
                throw new AppError(`Не найдена группа с id ${dto.groupId}`, 404);
            }
        }

        if (dto.password) {
            const passwordHash = await hash(dto.password, 10);
            existing.passwordHash = passwordHash;
        }

        existing.fullName = dto.fullName;
        existing.groupId = dto.groupId;
        existing.login = dto.login;
        existing.role = dto.role as UserRole;
        await this.userRepository.save(existing);

        const savedUser = await this.userRepository.findOne({
            where: { id: existing.id },
            relations: ['group']
        });

        return {
            data: { id: existing.id, fullName: existing.fullName, login: existing.login, role: existing.role, groupName: savedUser!.group?.name, groupId: existing.groupId }
        };
    }

    public static async getSubjects(dto: SubjectsQueryDTO) {
        const query = this.subjectRepository.createQueryBuilder('subject');

        if (dto.searchString) {
            query.andWhere('subject.name ILIKE :search', { search: `%${dto.searchString}%`});
        }

        if (dto.groupIds && dto.groupIds.length > 0) {
            query.innerJoin('subject.courses', 'course', 'course.groupId IN (:...groupIds)', { groupIds: dto.groupIds });
            query.distinct(true);
        }

        const sort = dto.sort || 'ASC';
        query.orderBy('subject.name', sort);

        const page = dto.page || 1;
        const pageSize = dto.pageSize || 50;
        query.skip((page - 1) * pageSize).take(pageSize);

        const [subjects, total] = await query.getManyAndCount();

        return {
            data: subjects,
            meta: {
                page: page,
                pageSize: pageSize,
                total: total,
                totalPages: Math.ceil(total / pageSize)
            }
        }
    }

    public static async addSubject(dto: SubjectDTO) {
        const existing = await this.subjectRepository.findOneBy({ name: dto.name });

        if (existing) {
            throw new AppError(`Предмет ${dto.name} уже существует`, 409);
        }

        const newSubject = this.subjectRepository.create({
            name: dto.name
        });

        await this.subjectRepository.save(newSubject);

        return {
            data: { id: newSubject.id, name: newSubject.name }
        };
    }

    public static async deleteSubject(subjectId: number) {
        const existing = await this.subjectRepository.findOneBy({ id: subjectId });
        if (!existing) {
            throw new AppError(`Не найден предмет с id ${subjectId}`, 404);
        }

        await this.subjectRepository.delete({ id: subjectId });
    }

    public static async updateSubject(subjectId: number, dto: SubjectDTO) {
        const existing = await this.subjectRepository.findOneBy({ id: subjectId });
        if (!existing) {
            throw new AppError(`Не найден предмет с id ${subjectId}`, 404);
        }

        if (dto.name !== existing.name && await this.subjectRepository.findOneBy({ name: dto.name })) {
            throw new AppError(`Предмет ${dto.name} уже существует`, 409);
        }

        existing.name = dto.name;
        await this.subjectRepository.save(existing);

        return {
            data: { id: existing.id, name: existing.name }
        };
    }

    public static async getGroups(dto: GroupsQueryDTO) {
        const query = this.groupRepository.createQueryBuilder('group');
        query.leftJoin('users', 'curator', 'curator.role = :teacherRole AND curator.group_id = group.id', { teacherRole: 'teacher' })
            .addSelect('curator.full_name', 'curatorName');

        if (dto.searchString) {
            query.andWhere('group.name ILIKE :search', { search: `%${dto.searchString}%`});
        }

        const sort = dto.sort || 'ASC';
        query.orderBy('group.name',sort);
        
        const page = dto.page || 1;
        const pageSize = dto.pageSize || 50;
        query.skip((page - 1) * pageSize).take(pageSize);

        const { raw, entities } = await query.getRawAndEntities();

        const data = entities.map((group, index) => ({
            id: group.id,
            name: group.name,
            curatorName: raw[index]?.curatorName || null,
        }));

        const totalQuery = this.groupRepository.createQueryBuilder('group');
        if (dto.searchString) {
            totalQuery.andWhere('group.name ILIKE :search', { search: `%${dto.searchString}%` });
        }
        const total = await totalQuery.getCount();

        return {
            data: data,
            meta: {
                page: page,
                pageSize: pageSize,
                total: total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }

    public static async addGroup(dto: GroupDTO) {
        const existing = await this.groupRepository.findOneBy({ name: dto.name });

        if (existing) {
            throw new AppError(`Группа ${dto.name} уже сущесвует`, 409);
        }

        const newGroup = this.groupRepository.create({
            name: dto.name
        });

        await this.groupRepository.save(newGroup);

        return {
            data: { id: newGroup.id, name: newGroup.name }
        };
    }

    public static async deleteGroup(groupId: number) {
        const existing = await this.groupRepository.findOneBy({ id: groupId });
        if (!existing) {
            throw new AppError(`Не найдена группа с id ${groupId}`, 404);
        }

        await this.groupRepository.delete({ id: groupId });
    }

    public static async updateGroup(groupId: number, dto: GroupDTO) {
        const existing = await this.groupRepository.findOneBy({ id: groupId });
        if (!existing) {
            throw new AppError(`Не найдена группа с id ${groupId}`, 404);
        }

        if (dto.name !== existing.name && await this.groupRepository.findOneBy({ name: dto.name })) {
            throw new AppError(`Группа ${dto.name} уже существует`, 409);
        }

        existing.name = dto.name;
        await this.groupRepository.save(existing);

        return {
            data: {id: existing.id, name: existing.name }
        };
    }
}