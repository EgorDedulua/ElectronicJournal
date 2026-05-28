import Joi from "joi";

export const updateWorkSchema = Joi.object({
    title: Joi.string().max(200).optional().messages({
        'any.required' : 'Тема работы обязательна',
        'string.max' : 'Тема работы не может быть длиннее 200 символов',
        'string.base' : 'Тема работы должна быть строкой'
    }),
    desciption: Joi.string().optional().messages({
        'string.base' : 'Описание работы должно быть строкой'
    }),
    deadline: Joi.date().iso().optional().messages({
        'date.iso' : 'Дедлайн должен быть в формате iso',
        'date.base' : 'Дедлайн должен быть в корректном формате даты (iso)',
    }),
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