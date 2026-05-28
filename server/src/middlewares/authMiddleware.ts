import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config/config";
import { User } from "@/entities/user";
import { AppDataSource } from "@/config/data-source";

export interface JwtPayload {
    id: number;
    role: 'student' | 'teacher' | 'admin';
    groupId?: number | null;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: 'Требуется аутентификация '});
    }
    
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: decoded.id },
            select: ['id', 'role', 'groupId'] 
        });

        if (!user) {
            return res.status(401).json({ error: 'Пользователь не найден' });
        }
        
        req.user = {
            id: user.id,
            role: user.role,
            groupId: user.groupId   
        };

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Недействительный токен '});
    }
}
