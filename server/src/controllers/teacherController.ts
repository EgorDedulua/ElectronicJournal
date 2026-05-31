import { CommentDTO } from '@/dto/commentDTO';
import { LateDTO } from '@/dto/lateDTO';
import { LessonDTO } from '@/dto/lessonDTO';
import { MarkDTO } from '@/dto/markDTO';
import { CommentsQueryDTO } from '@/dto/queries/commentsQueryDTO';
import { UpdateWorkDTO } from '@/dto/updateWorkDTO';
import { WorkDTO } from '@/dto/workDTO';
import { TeacherService } from '@/services/teacherService';
import { TimetableService } from '@/services/timetableService';
import { WorkCommentsService } from '@/services/workCommentsService';
import { WorkService } from '@/services/workService';
import { Request, Response } from 'express';

export class TeacherController {
    public static async getTimetable(req: Request, res: Response) {
        const result = await TimetableService.getTeacherTimetable(req.user!.id);
        res.status(200).json(result);
    }
    
    public static async getGroups(req: Request, res: Response) {
        const result = await TeacherService.getGroups(req.user!.id);
        res.status(200).json(result);
    }

    public static async getStudents(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const result = await TeacherService.getStudents(req.user!.id, groupId);
        res.status(200).json(result);
    }

    public static async getSubjects(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const result = await TeacherService.getSubjects(req.user!.id, groupId);
        res.status(200).json(result);
    }

    public static async getLessons(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const subjectId = Number(req.params.subjectId);
        const result = await TeacherService.getLessons(req.user!.id, groupId, subjectId);
        res.status(200).json(result);
    }

    public static async getWork(req: Request, res: Response) {
        const { subjectId, groupId, lessonId, workId } = req.params;
        const result = await WorkService.get(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), Number(groupId));
        res.status(200).json(result);
    }

    public static async getWorkComments(req: Request, res: Response) {
        const { subjectId, groupId, lessonId, workId } = req.params;
        const dto: CommentsQueryDTO = req.query;
        const result = await WorkCommentsService.get(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), dto, Number(groupId));
        res.status(200).json(result);
    }

    public static async createWorkComment(req: Request, res: Response) {
        const { subjectId, groupId, lessonId, workId } = req.params;
        const dto: CommentDTO = req.body;
        const result = await WorkCommentsService.create(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), dto, Number(groupId));
        res.status(200).json(result);
    }

    public static async updateWorkComment(req: Request, res: Response) {
        const { subjectId, groupId, lessonId, workId, commentId } = req.params;
        const { text } = req.body;
        const result = await WorkCommentsService.update(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), Number(commentId), text, Number(groupId));
        res.status(200).json(result);
    }

    public static async deleteWorkComment(req: Request, res: Response) {
        const { subjectId, groupId, lessonId, workId, commentId } = req.params;
        await WorkCommentsService.delete(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), Number(commentId), Number(groupId));
        res.status(204).send();
    }

    public static async addWork(req: Request, res: Response) {
        const { subjectId, groupId, lessonId } = req.params;
        const dto: WorkDTO = req.body;
        const files = req.files as Express.Multer.File[] | undefined;
        const result = await WorkService.create(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), dto, files);
        res.status(200).json(result);
    }

    public static async updateWork(req: Request, res: Response) {
        const { subjectId, groupId, lessonId, workId } = req.params;
        const dto: UpdateWorkDTO = req.body;
        const files = req.files as Express.Multer.File[];
        const result = await WorkService.update(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(workId), dto, files);
        res.status(200).json(result);
    }

    public static async deleteWork(req: Request, res: Response) {
        const { subjectId, groupId, lessonId, workId } = req.params;
        await WorkService.delete(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(workId));
        res.status(204).send();
    }

    public static async addLesson(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const subjectId = Number(req.params.subjectId);
        const dto: LessonDTO = req.body;
        const result = await TeacherService.addLesson(req.user!.id, subjectId, groupId, dto);
        res.status(201).json(result);
    }

    public static async deleteLesson(req: Request, res: Response) {
        const { groupId, subjectId, lessonId } = req.params;
        await TeacherService.deleteLesson(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId));
        res.status(204).send();
    }

    public static async getStudentsMarks(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const subjectId = Number(req.params.subjectId);
        const result = await TeacherService.getStudentsMarks(req.user!.id, groupId, subjectId);
        res.status(200).json(result);
    }

    public static async addMark(req: Request, res: Response) {
        const { groupId, subjectId, lessonId } = req.params;
        const dto: MarkDTO = req.body;
        const result = await TeacherService.addMark(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), dto);
        res.status(201).json(result);
    }

    public static async deleteMark(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, markId } = req.params;
        await TeacherService.deleteMark(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(markId));
        res.status(204).send();
    }

    public static async updateMark(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, markId } = req.params;
        const { mark } = req.body;
        const result = await TeacherService.updateMark(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId),
            Number(markId), mark);
        res.status(200).json(result);
    }

    public static async getStudentsAbsences(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const subjectId = Number(req.params.subjectId);
        const result = await TeacherService.getStudentsAbsences(req.user!.id, groupId, subjectId);
        res.status(200).json(result);
    }

    public static async addAbsence(req: Request, res: Response) {
        const { groupId, subjectId, lessonId } = req.params;
        const { studentId } = req.body;
        const result = await TeacherService.addAbsence(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), studentId);
        res.status(201).json(result);
    }

    public static async deleteAbsence(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, absenceId } = req.params;
        await TeacherService.deleteAbsence(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(absenceId));
        res.status(204).send();
    }

    public static async getStudentsLates(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const subjectId = Number(req.params.subjectId);
        const result = await TeacherService.getStudentsLates(req.user!.id, groupId, subjectId);
        res.status(200).json(result);
    }

    public static async addLate(req: Request, res: Response) {
        const { groupId, subjectId, lessonId } = req.params;
        const dto: LateDTO = req.body;
        const result = await TeacherService.addLate(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), dto);
        res.status(201).json(result);
    }

    public static async deleteLate(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, lateId } = req.params;
        await TeacherService.deleteLate(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(lateId));
        res.status(204).send();
    }

    public static async updateLate(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, lateId } = req.params;
        const { minutes } = req.body;
        const result = await TeacherService.updateLate(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), 
            Number(lateId), minutes);
        res.status(200).json(result);
    }

    public static async getStudentsCredits(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const subjectId = Number(req.params.subjectId);
        const result = await TeacherService.getStudentsCredits(req.user!.id, groupId, subjectId);
        res.status(200).json(result);
    }

    public static async addCredit(req: Request, res: Response) {
        const { groupId, subjectId, lessonId } = req.params;
        const { studentId } = req.body;
        const result = await TeacherService.addCredit(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), studentId);
        res.status(201).json(result);
    }

    public static async deleteCredit(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, creditId } = req.params;
        await TeacherService.deleteCredit(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(creditId));
        res.status(204).send();
    }
}