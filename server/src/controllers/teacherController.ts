import { LateDTO } from '@/dto/lateDTO';
import { LessonDTO } from '@/dto/lessonDTO';
import { MarkDTO } from '@/dto/markDTO';
import { TeacherService } from '@/services/teacherService';
import { Request, Response } from 'express';

export class TeacherController {
    public static async getGroups(req: Request, res: Response) {
        const result = await TeacherService.getGroups(req.user!.id);
        res.status(200).json(result);
    }

    public static async getSubjects(req: Request, res: Response) {
        const groupId = Number(req.params.id);
        const result = await TeacherService.getSubjects(req.user!.id, groupId);
        res.status(200).json(result);
    }

    public static async getLessons(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const subjectId = Number(req.params.subjectId);
        const result = await TeacherService.getLessons(req.user!.id, groupId, subjectId);
        res.status(200).json(result);
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
        const { groupId, subjectId, lessonId, id } = req.params;
        await TeacherService.deleteMark(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(id));
        res.status(204).send();
    }

    public static async updateMark(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, id } = req.params;
        const { mark } = req.body;
        const result = await TeacherService.updateMark(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId),
            Number(id), mark);
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
        const { groupId, subjectId, lessonId, id } = req.params;
        await TeacherService.deleteAbsence(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(id));
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
        const { groupId, subjectId, lessonId, id } = req.params;
        await TeacherService.deleteLate(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(id));
        res.status(204).send();
    }

    public static async updateLate(req: Request, res: Response) {
        const { groupId, subjectId, lessonId, id } = req.params;
        const { minutes } = req.body;
        const result = await TeacherService.updateLate(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), 
            Number(id), minutes);
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
        const { groupId, subjectId, lessonId, id } = req.params;
        await TeacherService.deleteCredit(req.user!.id, Number(subjectId), Number(groupId), Number(lessonId), Number(id));
        res.status(204).send();
    }
}