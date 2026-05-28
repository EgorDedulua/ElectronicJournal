import { AdminController } from "@/controllers/adminController";
import { UserRole } from "@/entities/user";
import { authenticate } from "@/middlewares/authMiddleware";
import { authorize } from "@/middlewares/authorizeMiddleware";
import { validate } from "@/middlewares/validationMiddleware";
import { registerSchema } from "@/validation/registerSchema";
import { groupSchema } from "@/validation/groupSchema";
import { subjectSchema } from "@/validation/subjectSchema";
import { Router } from "express";
import { searchingSchema } from "@/validation/common/searchingSchema";
import { usersQuerySchema } from "@/validation/queries/usersQuerySchema";
import { subjectsQuerySchema } from "@/validation/queries/subjectsQuerySchema";
import { coursesQuerySchema } from "@/validation/queries/coursesQuerySchema";
import { courseSchema } from "@/validation/courseSchema";
import { timetableArraySchema, timetableSchema } from "@/validation/timetableSchema";
import { updateUserSchema } from "@/validation/updateUserSchema";
import { paramsSchema } from "@/validation/common/paramsSchema";

const adminRouter = Router();

adminRouter.use(authenticate);
adminRouter.use(authorize(UserRole.ADMIN));

adminRouter.get('/users', validate(searchingSchema, 'query'), validate(usersQuerySchema, 'query'), AdminController.getUsers);
adminRouter.post('/users', validate(registerSchema), AdminController.registerUser);
adminRouter.delete('/users/:userId', validate(paramsSchema, 'params'), AdminController.deleteUser);
adminRouter.put('/users/:userId', validate(paramsSchema, 'params'), validate(updateUserSchema), AdminController.updateUser);

adminRouter.get('/subjects', validate(searchingSchema, 'query'), validate(subjectsQuerySchema, 'query'), AdminController.getSubjects);
adminRouter.post('/subjects', validate(subjectSchema), AdminController.addSubject);
adminRouter.delete('/subjects/:subjectId', validate(paramsSchema, 'params'), AdminController.deleteSubject);
adminRouter.put('/subjects/:subjectId', validate(paramsSchema, 'params'), validate(subjectSchema), AdminController.updateSubject);

adminRouter.get('/groups', validate(searchingSchema, 'query'), AdminController.getGroups);
adminRouter.post('/groups', validate(groupSchema), AdminController.addGroup);
adminRouter.delete('/groups/:groupId', validate(paramsSchema, 'params'), AdminController.deleteGroup);
adminRouter.put('/groups/:groupId', validate(paramsSchema, 'params'), validate(groupSchema), AdminController.updateGroup);

adminRouter.get('/courses', validate(searchingSchema, 'query'), validate(coursesQuerySchema, 'query'), AdminController.getCourses);
adminRouter.post('/courses', validate(courseSchema), AdminController.addCourse);
adminRouter.delete('/courses/:courseId', validate(paramsSchema, 'params'), AdminController.deleteCourse);
adminRouter.put('/courses/:courseId', validate(paramsSchema, 'params'), validate(courseSchema), AdminController.updateCourse);

adminRouter.get('/timetables', validate(paramsSchema, 'params'), AdminController.getTimetables);
adminRouter.post('/timetables', validate(timetableArraySchema), AdminController.addTimetable);
adminRouter.delete('/timetables/:timetableId', validate(paramsSchema, 'params'), AdminController.deleteTimetable);
adminRouter.put('/timetables/:timetableId', validate(paramsSchema, 'params'), validate(timetableSchema), AdminController.updateTimetable);

export default adminRouter;