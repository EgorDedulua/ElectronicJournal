import { TeacherController } from "@/controllers/teacherController";
import { UserRole } from "@/entities/user";
import { authenticate } from "@/middlewares/authMiddleware";
import { authorize } from "@/middlewares/authorizeMiddleware";
import { validate } from "@/middlewares/validationMiddleware";
import { idSchema } from "@/validation/common/idSchema";
import { groupAndSubjectIdSchema } from "@/validation/common/groupAndSubjectIdSchema";
import { lessonIdSchema } from "@/validation/common/lessonIdSchema";
import { lessonSchema } from "@/validation/lessonSchema";
import { markSchema } from "@/validation/markSchema";
import { Router } from "express";
import { studentIdSchema } from "@/validation/common/studentIdSchema";
import { lateSchema } from "@/validation/lateSchema";
import { updateLateSchema } from "@/validation/updateLateSchema";
import { updateMarkSchema } from "@/validation/updateMarkSchema";

const teacherRouter = Router();

teacherRouter.use(authenticate);
teacherRouter.use(authorize(UserRole.TEACHER));
teacherRouter.get('/groups', TeacherController.getGroups);
teacherRouter.get('/groups/:id/subjects', validate(idSchema, 'params'), TeacherController.getSubjects);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/lessons', validate(groupAndSubjectIdSchema, 'params'), TeacherController.getLessons);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonSchema), TeacherController.addLesson);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonIdSchema, 'params'), TeacherController.deleteLesson);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/marks', validate(groupAndSubjectIdSchema, 'params')
    ,TeacherController.getStudentsMarks);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks', validate(groupAndSubjectIdSchema, 'params'), validate(lessonIdSchema, 'params')
    ,validate(markSchema), TeacherController.addMark);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:id', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonIdSchema, 'params'), validate(idSchema, 'params'), TeacherController.deleteMark);
teacherRouter.patch('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:id', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonIdSchema, 'params'), validate(idSchema, 'params'), validate(updateMarkSchema), TeacherController.updateMark);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/absences', validate(groupAndSubjectIdSchema, 'params'), TeacherController.getStudentsAbsences);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences', validate(groupAndSubjectIdSchema, 'params'), validate(lessonIdSchema, 'params')
    ,validate(studentIdSchema), TeacherController.addAbsence);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences/:id', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonIdSchema, 'params'), validate(idSchema, 'params'), TeacherController.deleteAbsence);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/lates', validate(groupAndSubjectIdSchema, 'params'), TeacherController.getStudentsLates);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates', validate(groupAndSubjectIdSchema, 'params'), validate(lessonIdSchema, 'params')
    ,validate(lateSchema), TeacherController.addLate);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:id', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonIdSchema, 'params'), validate(idSchema, 'params'), TeacherController.deleteLate);
teacherRouter.patch('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:id', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonIdSchema, 'params'), validate(idSchema, 'params'), validate(updateLateSchema), TeacherController.updateLate);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/credits', validate(groupAndSubjectIdSchema, 'params'), TeacherController.getStudentsCredits);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits', validate(groupAndSubjectIdSchema, 'params'), validate(lessonIdSchema, 'params')
    ,validate(studentIdSchema), TeacherController.addCredit);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits/:id', validate(groupAndSubjectIdSchema, 'params')
    ,validate(lessonIdSchema, 'params'), validate(idSchema, 'params'), TeacherController.deleteCredit);

export default teacherRouter;