import { StudentController } from '@/controllers/studentController';
import { UserRole } from '@/entities/user';
import { authenticate } from '@/middlewares/authMiddleware';
import { authorize } from '@/middlewares/authorizeMiddleware';
import { validate } from '@/middlewares/validationMiddleware';
import { idSchema } from '@/validation/common/idSchema';
import { Router } from 'express';

const studentRouter = Router();

studentRouter.use(authenticate);
studentRouter.use(authorize(UserRole.STUDENT));
studentRouter.get('/timetable/:id', validate(idSchema, 'params'), StudentController.getTimetable);
studentRouter.get('/subjects', StudentController.getSubjects);
studentRouter.get('/subjects/:id/lessons', validate(idSchema, 'params'), StudentController.getLessons);
studentRouter.get('/subjects/:id/marks', validate(idSchema, 'params') ,StudentController.getMarks);
studentRouter.get('/subjects/:id/absences', validate(idSchema, 'params'), StudentController.getAbsences);
studentRouter.get('/subjects/:id/lates', validate(idSchema, 'params'), StudentController.getLates);
studentRouter.get('/subjects/:id/credits', validate(idSchema, 'params'), StudentController.getCredits);

export default studentRouter;