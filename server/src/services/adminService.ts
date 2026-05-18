import { AppDataSource } from "@/config/data-source";
import { User, UserRole } from "@/entitites/user";
import { RegisterDTO } from "@/dto/auth/registerDTO";
import { AppError } from "@/utils/appError";
import { hash } from "bcryptjs";
import { Group } from "@/entitites/group";
import { SubjectDTO } from "@/dto/subjectDTO";
import { GroupDTO } from "@/dto/groupDTO";
import { Subject } from "@/entitites/subject";

export class AdminService {
    private static userRepository = AppDataSource.getRepository(User);
    private static groupRepository = AppDataSource.getRepository(Group);
    private static subjectRepository = AppDataSource.getRepository(Subject);

    static async registerUser(dto: RegisterDTO) {
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

        const passwordHash = await hash(dto.password, 10);
        const newUser = this.userRepository.create({
            login: dto.login,
            passwordHash,
            fullName: dto.fullName,
            groupId: dto.groupId,
            role: dto.role as UserRole
        });
        await this.userRepository.save(newUser);

        return {
            data: { id: newUser.id, fullName: newUser.fullName, role: newUser.role, login: newUser.login, groupName: newUser.group?.name}
        };
    }

    static async addSubject(dto: SubjectDTO) {
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

    static async addGroup(dto: GroupDTO) {

    }
}