import { LoginDTO } from "@/dto/loginDTO";
import { AuthService } from "@/services/authService";
import { Request, Response } from "express";

export class AuthController {
    static async login(req: Request, res: Response) {
        const dto: LoginDTO = req.body;
        const result = await AuthService.login(dto);
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.status(200).json({ data: result.data });
    }

    static async logout(req: Request, res: Response) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });
        res.status(204).send();
    }
}