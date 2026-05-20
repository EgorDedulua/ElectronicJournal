import { UserRole } from "@/entities/user";
import { Request, Response, NextFunction } from "express";

export const authorize = (role: UserRole) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error : 'Требуется аутентификация' });
        }

        if (req.user.role != role) {
            return res.status(403).json({ error : 'Недостаточно прав' });
        }

        next();
    }
}