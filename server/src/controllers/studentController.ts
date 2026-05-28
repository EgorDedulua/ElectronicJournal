import { StudentService } from '@/services/studentService';
import { TimetableService } from '@/services/timetableService';
import { WorkService } from '@/services/workService';
import { Request, Response } from 'express';

export class StudentController {
    public static async getTimetable(req: Request, res: Response) {
        const groupId = Number(req.params.groupId);
        const result = await TimetableService.getGroupTimetable(req.user!, groupId);
        res.status(200).json(result);
    }

    public static async getSubjects(req: Request, res: Response) {
        const result = await StudentService.getSubjects(req.user!.id);
        res.status(200).json(result);
    }

    public static async getLessons(req: Request, res: Response) {
        const subjectId = Number(req.params.subjectId);
        const result = await StudentService.getLessons(req.user!.id, subjectId);
        res.status(200).json(result);
    }

    public static async getWork(req: Request, res: Response) {
        const { subjectId, lessonId, workId } = req.params;
        const result = await WorkService.get(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), req.user!.groupId)
        res.status(200).json(result)
    }

    public static async getMarks(req: Request, res: Response) {
        const subjectId = Number(req.params.subjectId);
        const result = await StudentService.getMarks(req.user!.id, subjectId);
        res.status(200).json(result);
    }
    
    public static async getAbsences(req: Request, res: Response) {
        const subjectId = Number(req.params.subjectId);
        const result = await StudentService.getAbsences(req.user!.id, subjectId);
        res.status(200).json(result);
    }

    public static async getLates(req: Request, res: Response) {
        const subjectId = Number(req.params.subjectId);
        const result = await StudentService.getLates(req.user!.id, subjectId);
        res.status(200).json(result);
    }

    public static async getCredits(req: Request, res: Response) {
        const subjectId = Number(req.params.subjectId);
        const result = await StudentService.getCredits(req.user!.id, subjectId);
        res.status(200).json(result);
    }
}