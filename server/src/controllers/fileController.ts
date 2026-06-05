import { FileService } from '@/services/fileService';
import { Request, Response } from 'express';

export class FileController {
    public static async downloadWorkFile(req: Request, res: Response) {
        const fileId = Number(req.params.fileId);
        const result = await FileService.getWorkFile(req.user!.id, fileId);
        res.download(result.absolutePath, result.originalName);
    }

    public static async downloadSolutionFile(req: Request, res: Response) {
        const fileId = Number(req.params.fileId);
        const result = await FileService.getSolutionFile(req.user!.id, fileId);
        res.download(result.absolutePath, result.originalName);
    }
}