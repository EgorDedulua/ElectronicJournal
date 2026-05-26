import { AppDataSource } from "@/config/data-source";
import { LoginDTO } from "@/dto/loginDTO";
import { User } from "@/entities/user";
import { AppError } from "@/utils/appError";
import { compare } from "bcryptjs";
import { config } from "@/config/config";
import { sign } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export class AuthService {
    private static userRepository = AppDataSource.getRepository(User);

    public static async login(dto: LoginDTO) {
        const user = await this.userRepository.findOne({ where: { login: dto.login }, relations: ['group'] });
        if (!user) {
            throw new AppError('Неверный логин или пароль', 401);
        }

        if(!await compare(dto.password, user.passwordHash)) {
            throw new AppError('Неверный логин или пароль', 401);
        }

        const token = sign({ id: user.id, role: user.role }, config.JWT_SECRET, {
            expiresIn: config.JWT_EXPIRES_IN as any
        });

        return {
            token: token,
            data: { id: user.id, fullName: user.fullName, role: user.role, groupName: user.group?.name, isExpelled: user.isExpelled,
                groupId: user.groupId
             }
        };
    }
}