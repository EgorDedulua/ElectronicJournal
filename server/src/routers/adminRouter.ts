import { AdminController } from "@/controllers/adminController";
import { UserRole } from "@/entities/user";
import { authenticate } from "@/middlewares/authMiddleware";
import { authorize } from "@/middlewares/authorizeMiddleware";
import { validate } from "@/middlewares/validationMiddleware";
import { registerSchema } from "@/validation/registerSchema";
import { groupSchema } from "@/validation/groupSchema";
import { idSchema } from "@/validation/idSchema";
import { subjectSchema } from "@/validation/subjectSchema";
import { Router } from "express";
import { searchingSchema } from "@/validation/searchingSchema";
import { usersQuerySchema } from "@/validation/usersQuerySchema";
import { subjectsQuerySchema } from "@/validation/subjectsQuerySchema";

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize(UserRole.ADMIN));
adminRouter.get('/users', validate(searchingSchema, 'query'), validate(usersQuerySchema, 'query'), AdminController.getUsers);
adminRouter.post('/users', validate(registerSchema), AdminController.registerUser);
adminRouter.delete('/users/:id', validate(idSchema, 'params'), AdminController.deleteUser);
adminRouter.put('/users/:id', validate(idSchema, 'params'), validate(registerSchema), AdminController.updateUser);
adminRouter.get('/subjects', validate(searchingSchema, 'query'), validate(subjectsQuerySchema, 'query'), AdminController.getSubjects);
adminRouter.post('/subjects', validate(subjectSchema), AdminController.addSubject);
adminRouter.delete('/subjects/:id', validate(idSchema, 'params'), AdminController.deleteSubject);
adminRouter.put('/subjects/:id', validate(idSchema, 'params'), validate(subjectSchema), AdminController.updateSubject);
adminRouter.get('/groups', validate(searchingSchema, 'query'), AdminController.getGroups);
adminRouter.post('/groups', validate(groupSchema), AdminController.addGroup);
adminRouter.delete('/groups/:id', validate(idSchema, 'params'), AdminController.deleteGroup);
adminRouter.put('/groups/:id', validate(idSchema, 'params'), validate(groupSchema), AdminController.updateGroup);

export default adminRouter;