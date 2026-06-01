import multer from "multer";
import { v4 } from 'uuid';
import path from "node:path";

const setFilename: multer.DiskStorageOptions['filename'] = (req, file, cb) => {
    const ext = path.extname(file.originalname);
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

export const uploadWorkFiles = multer({
    storage: workStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'application/zip'];
        cb(null, allowed.includes(file.mimetype));
    }
}).array('files', 10);

export const uploadSolutionFiles = multer({
    storage: solutionStorage,
    limits: { fileSize: 10 *1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ,'application/msword', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        cb(null, allowed.includes(file.mimetype));
    }
}).array('files', 10);