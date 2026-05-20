import { AuthController } from "@/controllers/authController";
import { authenticate } from "@/middlewares/authMiddleware";
import { validate } from "@/middlewares/validationMiddleware";
import { loginSchema } from "@/validation/loginSchema";
import { Router } from "express";


const authRouter = Router();

authRouter.post('/auth', validate(loginSchema), AuthController.login);
authRouter.post('/logout', authenticate, AuthController.logout);

export default authRouter;