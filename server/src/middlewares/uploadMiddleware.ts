import multer from "multer";
import { v4 } from 'uuid';
import path from "node:path";
import { Request } from "express";

const looksLikeMojibake = (name: string): boolean => {
    return (
        name.includes('\uFFFD') ||
        /[ÃÐÑÒÓÔÕÖ×ØÙÚÛÜÝ]/.test(name) ||
        /[Ââ]/.test(name)
    );
};

const fixOriginalNameEncoding = (originalName: string): string => {
    if (!looksLikeMojibake(originalName)) return originalName;
    try {
        return Buffer.from(originalName, 'latin1').toString('utf8');
    } catch {
        return originalName;
    }
};

const ALLOWED_MIMES = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/zip',
    'application/x-zip-compressed',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXTS = new Set([
    '.pdf', '.png', '.jpg', '.jpeg', '.zip',
    '.doc', '.docx', '.xls', '.xlsx',
]);

const setFilename: multer.DiskStorageOptions['filename'] = (req, file, cb) => {
    file.originalname = fixOriginalNameEncoding(file.originalname);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, v4() + ext);
};

const workStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/works/'),
    filename: setFilename
});

const solutionStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/solutions/'),
    filename: setFilename
});

function createFileFilter() {
    return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ALLOWED_MIMES.has(file.mimetype) || ALLOWED_EXTS.has(ext)) {
            cb(null, true);
            return;
        }
        cb(new Error(`Тип файла не поддерживается: ${file.originalname}`));
    };
}

const fileFilter = createFileFilter();

export const uploadWorkFiles = multer({
    storage: workStorage,
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
    fileFilter,
}).array('files', 10);

export const uploadSolutionFiles = multer({
    storage: solutionStorage,
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
    fileFilter,
}).array('files', 10);