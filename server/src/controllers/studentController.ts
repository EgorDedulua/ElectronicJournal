import { StudentService } from '@/services/studentService';
import { Request, Response } from 'express';

export class StudentController {
    public static async getSubjects(req: Request, res: Response) {
        const result = await StudentService.getSubjects(req.user!.id);
        res.status(200).json(result);
    }

    public static async getLessons(req: Request, res: Response) {
        const subjectId = Number(req.params.id);
        const result = await StudentService.getLessons(req.user!.id, subjectId);
        res.status(200).json(result);
    }

    public static async getMarks(req: Request, res: Response) {
        const subjectId = Number(req.params.id);
        const result = await StudentService.getMarks(req.user!.id, subjectId);
        res.status(200).json(result);
    }
    
    public static async getAbsences(req: Request, res: Response) {
        const subjectId = Number(req.params.id);
        const result = await StudentService.getAbsences(req.user!.id, subjectId);
        res.status(200).json(result);
    }

    public static async getLates(req: Request, res: Response) {
        const subjectId = Number(req.params.id);
        const result = await StudentService.getLates(req.user!.id, subjectId);
        res.status(200).json(result);
    }

    public static async getCredits(req: Request, res: Response) {
        const subjectId = Number(req.params.id);
        const result = await StudentService.getCredits(req.user!.id, subjectId);
        res.status(200).json(result);
    }
}