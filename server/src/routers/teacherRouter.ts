import { TeacherController } from "@/controllers/teacherController";
import { UserRole } from "@/entities/user";
import { authenticate } from "@/middlewares/authMiddleware";
import { authorize } from "@/middlewares/authorizeMiddleware";
import { validate } from "@/middlewares/validationMiddleware";
import { lessonSchema } from "@/validation/lessonSchema";
import { markSchema } from "@/validation/markSchema";
import { Router } from "express";
import { studentIdSchema } from "@/validation/common/studentIdSchema";
import { lateSchema } from "@/validation/lateSchema";
import { updateLateSchema } from "@/validation/updateLateSchema";
import { updateMarkSchema } from "@/validation/updateMarkSchema";
import { paramsSchema } from "@/validation/common/paramsSchema";
import { workSchema } from "@/validation/workSchema";
import { uploadWorkFiles } from "@/middlewares/uploadMiddleware";
import { updateWorkSchema } from "@/validation/updateWorkSchema";

const teacherRouter = Router();

teacherRouter.use(authenticate);
teacherRouter.use(authorize(UserRole.TEACHER));

teacherRouter.get('/timetable', TeacherController.getTimetable);

teacherRouter.get('/groups', TeacherController.getGroups);
teacherRouter.get('/groups/:groupId/subjects', validate(paramsSchema, 'params') , TeacherController.getSubjects);

teacherRouter.get('/groups/:groupId/students', validate(paramsSchema, 'params') , TeacherController.getStudents);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/lessons', validate(paramsSchema, 'params') , TeacherController.getLessons);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons', validate(paramsSchema, 'params') 
    ,validate(lessonSchema), TeacherController.addLesson);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId', validate(paramsSchema, 'params')
    ,TeacherController.deleteLesson);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId', validate(paramsSchema, 'params')
    , TeacherController.getWork);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works', validate(paramsSchema, 'params'),  uploadWorkFiles
    ,validate(workSchema), TeacherController.addWork);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId', validate(paramsSchema, 'params')
    ,TeacherController.deleteWork);
teacherRouter.put('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/works/:workId', validate(paramsSchema, 'params'), uploadWorkFiles
    ,validate(updateWorkSchema), TeacherController.updateWork);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/marks', validate(paramsSchema, 'params')
    ,TeacherController.getStudentsMarks);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks', validate(paramsSchema, 'params')
    ,validate(markSchema), TeacherController.addMark);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:markId', validate(paramsSchema, 'params')
    ,TeacherController.deleteMark);
teacherRouter.patch('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/marks/:markId', validate(paramsSchema, 'params')
    ,validate(updateMarkSchema), TeacherController.updateMark);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/absences', validate(paramsSchema, 'params'), TeacherController.getStudentsAbsences);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences', validate(paramsSchema, 'params')
    ,validate(studentIdSchema), TeacherController.addAbsence);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/absences/:absenceId', validate(paramsSchema, 'params')
    ,TeacherController.deleteAbsence);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/lates', validate(paramsSchema, 'params'), TeacherController.getStudentsLates);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates', validate(paramsSchema, 'params')
    ,validate(lateSchema), TeacherController.addLate);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:lateId', validate(paramsSchema, 'params')
    ,TeacherController.deleteLate);
teacherRouter.patch('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/lates/:lateId', validate(paramsSchema, 'params')
    ,validate(updateLateSchema), TeacherController.updateLate);

teacherRouter.get('/groups/:groupId/subjects/:subjectId/credits', validate(paramsSchema, 'params'), TeacherController.getStudentsCredits);
teacherRouter.post('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits', validate(paramsSchema, 'params')
    ,validate(studentIdSchema), TeacherController.addCredit);
teacherRouter.delete('/groups/:groupId/subjects/:subjectId/lessons/:lessonId/credits/:creditId', validate(paramsSchema, 'params')
   ,TeacherController.deleteCredit);

export default teacherRouter;