import { CommentDTO } from '@/dto/commentDTO';
import { CommentsQueryDTO } from '@/dto/queries/commentsQueryDTO';
import { UserRole } from '@/entities/user';
import { SolutionCommentsService } from '@/services/solutionCommentsService';
import { SolutionService } from '@/services/solutionService';
import { StudentService } from '@/services/studentService';
import { TimetableService } from '@/services/timetableService';
import { WorkCommentsService } from '@/services/workCommentsService';
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
        const result = await WorkService.get(req.user!.id, req.user!.role as UserRole, Number(subjectId), req.user!.groupId, Number(lessonId), Number(workId))
        res.status(200).json(result)
    }

    public static async getWorkComments(req: Request, res: Response) {
        const { subjectId, lessonId, workId } = req.params;
        const dto: CommentsQueryDTO = req.query;
        const result = await WorkCommentsService.get(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), dto, req.user!.groupId);
        res.status(200).json(result);
    }

    public static async createWorkComment(req: Request, res: Response) {
        const { subjectId, lessonId, workId } = req.params;
        const dto: CommentDTO = req.body;
        const result = await WorkCommentsService.create(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), dto, req.user!.groupId);
        res.status(200).json(result);
    }

    public static async updateWorkComment(req: Request, res: Response) {
        const { subjectId, lessonId, workId, commentId } = req.params;
        const { text } = req.body;
        const result = await WorkCommentsService.update(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), Number(commentId), text, req.user!.groupId);
        res.status(200).json(result);
    }

    public static async deleteWorkComment(req: Request, res: Response) {
        const { subjectId, lessonId, workId, commentId } = req.params;
        await WorkCommentsService.delete(req.user!.id, Number(subjectId), Number(lessonId), Number(workId), Number(commentId), req.user!.groupId);
        res.status(204).send();
    }

    public static async getSolutionComments(req: Request, res: Response) {
        const { subjectId, lessonId, workId, solutionId } = req.params;
        const dto: CommentsQueryDTO = req.query;
        const result = await SolutionCommentsService.get(req.user!.id, req.user!.role as UserRole, Number(subjectId), req.user!.groupId, Number(lessonId), 
            Number(workId), Number(solutionId), dto);
        res.status(200).json(result);
    }

    public static async createSolutionComment(req: Request, res: Response) {
        const { subjectId, lessonId, workId, solutionId } = req.params;
        const dto: CommentDTO = req.body;
        const result = await SolutionCommentsService.create(req.user!.id, req.user!.role as UserRole, Number(subjectId), req.user!.groupId, Number(lessonId), 
            Number(workId), Number(solutionId), dto);
        res.status(200).json(result);
    }

    public static async updateSolutionComment(req: Request, res: Response) {
        const { subjectId, lessonId, workId, solutionId, commentId } = req.params;
        const { text } = req.body;
        const result = await SolutionCommentsService.update(req.user!.id, req.user!.role as UserRole, Number(subjectId), req.user!.groupId, Number(lessonId), 
            Number(workId), Number(solutionId), Number(commentId), text);
        res.status(200).json(result);
    }

    public static async deleteSolutionComment(req: Request, res: Response) {
        const { subjectId, lessonId, workId, solutionId, commentId } = req.params;
        await SolutionCommentsService.delete(req.user!.id, req.user!.role as UserRole, Number(subjectId), req.user!.groupId, Number(lessonId), 
            Number(workId), Number(solutionId), Number(commentId));
        res.status(204).send();
    }

    public static async getSolution(req: Request, res: Response) {
        const { subjectId, lessonId, workId, solutionId } = req.params;
        const result = await SolutionService.get(req.user!.id, req.user!.role as UserRole, Number(subjectId), req.user!.groupId, Number(lessonId), Number(workId), Number(solutionId));
        res.status(200).json(result);
    }

    public static async createSolution(req: Request, res: Response) {
        const { subjectId, lessonId, workId } = req.params;
        const files = req.files as Express.Multer.File[] | undefined;
        const result = await SolutionService.create(req.user!.id, Number(subjectId), req.user!.groupId, Number(lessonId), Number(workId), files);
        res.status(200).json(result);
    }

    public static async updateSolution(req: Request, res: Response) {
        const { subjectId, lessonId, workId, solutionId } = req.params;
        const { deleteFileIds } = req.body;
        const files = req.files as Express.Multer.File[] | undefined;
        const result = await SolutionService.update(req.user!.id, Number(subjectId), req.user!.groupId, Number(lessonId), Number(workId), Number(solutionId), deleteFileIds, files);
        res.status(200).json(result);
    }

    public static async deleteSolution(req: Request, res: Response) {
        const { subjectId, lessonId, workId, solutionId } = req.params;
        await SolutionService.delete(req.user!.id, Number(subjectId), req.user!.groupId, Number(lessonId), Number(workId), Number(solutionId));
        res.status(204).send();
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