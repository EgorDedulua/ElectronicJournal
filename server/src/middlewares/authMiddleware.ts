import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@/config/config";

export interface JwtPayload {
    id: number;
    role: 'student' | 'teacher' | 'admin';
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error : 'Требуется авторизация' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Недействительный токен '});
    }
}
