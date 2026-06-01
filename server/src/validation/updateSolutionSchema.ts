import Joi from "joi";

export const updateSolutionSchema = Joi.object({
    deleteFileIds: Joi
    .string()
    .optional()
    .custom((value, helpers) => {
        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
                return helpers.error('deleteFileIds.mustBeArray');
            }
            for (const item of parsed) {
                if (!Number.isInteger(item) || item < 1) {
                    return helpers.error('deleteFileIds.invalidItem', { item });
                }
            }
            return parsed;
        } catch {
            return helpers.error('deleteFileIds.invalidJson');
        }
    })
    .messages({
        'deleteFileIds.mustBeArray': 'Id удаляемых файлов должны быть массивом',
        'deleteFileIds.invalidJson': 'Id удаляемых файлов должны быть в формате JSON-массива',
        'deleteFileIds.invalidItem': 'Каждый id должен быть положительным целым числом',
    }),
});