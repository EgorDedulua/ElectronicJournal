import { paramsSchema } from "@/validation/common/paramsSchema";
import { Router } from "express";
import { validate } from "@/middlewares/validationMiddleware";
import { FileController } from "@/controllers/fileController";
import { authenticate } from "@/middlewares/authMiddleware";

const fileRouter = Router();

fileRouter.use(authenticate);
fileRouter.get('/works/:fileId', validate(paramsSchema), FileController.downloadWorkFile);
fileRouter.get('/solutions/:fileId', validate(paramsSchema), FileController.downloadSolutionFile);

export default fileRouter;