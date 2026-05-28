import { access, constants } from 'fs/promises';

export const isFileAccesible = async(path: string) => {
    try {
        await access(path, constants.F_OK);
    } catch (err) {
        console.error(`Ошибка удаления файла ${path}:`, err);
        return false;
    }
};