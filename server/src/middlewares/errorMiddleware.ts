import { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/appError";
import multer from "multer";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message, message: err.message });
    }

    if (err instanceof multer.MulterError) {
        const message =
            err.code === 'LIMIT_FILE_SIZE'
                ? 'Файл слишком большой (максимум 10 МБ)'
                : err.code === 'LIMIT_FILE_COUNT'
                  ? 'Слишком много файлов (максимум 10)'
                  : err.message;
        return res.status(400).json({ error: message, message });
    }

    if (err.message?.includes('Тип файла не поддерживается')) {
        return res.status(400).json({ error: err.message, message: err.message });
    }

    console.error(`Необработанная ошибка`, err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера', message: 'Внутренняя ошибка сервера' });
};
