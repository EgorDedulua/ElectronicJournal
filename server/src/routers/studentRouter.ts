import { StudentController } from '@/controllers/studentController';
import { UserRole } from '@/entities/user';
import { authenticate } from '@/middlewares/authMiddleware';
import { authorize } from '@/middlewares/authorizeMiddleware';
import { validate } from '@/middlewares/validationMiddleware';
import { paramsSchema } from '@/validation/common/paramsSchema';
import { Router } from 'express';

const studentRouter = Router();

studentRouter.use(authenticate);
studentRouter.use(authorize(UserRole.STUDENT));
studentRouter.get('/timetable/:groupId', validate(paramsSchema, 'params') , StudentController.getTimetable);
studentRouter.get('/subjects', StudentController.getSubjects);
studentRouter.get('/subjects/:subjectId/lessons', validate(paramsSchema, 'params') , StudentController.getLessons);
studentRouter.get('/subjects/:subjectId/lessons/:lessonId/works/:workId', validate(paramsSchema, 'params'), StudentController.getWork);
studentRouter.get('/subjects/:subjectId/marks', validate(paramsSchema, 'params') ,StudentController.getMarks);
studentRouter.get('/subjects/:subjectId/absences', validate(paramsSchema, 'params') , StudentController.getAbsences);
studentRouter.get('/subjects/:subjectId/lates', validate(paramsSchema, 'params') , StudentController.getLates);
studentRouter.get('/subjects/:subjectId/credits', validate(paramsSchema, 'params') , StudentController.getCredits);

export default studentRouter;