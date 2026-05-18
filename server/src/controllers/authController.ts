import { LoginDTO } from "@/dto/auth/loginDTO";
import { AuthService } from "@/services/authService";
import { Request, Response } from "express";

export class AuthController {
    static async login(req: Request, res: Response) {
        const dto: LoginDTO = req.body;
        const result = await AuthService.login(dto);
        res.status(200).json(result);
    }
}