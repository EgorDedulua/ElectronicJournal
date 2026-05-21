import Joi from "joi";

export const subjectsQuerySchema = Joi.object({
    groupIds: Joi.array().items(Joi.number().integer().positive().messages({
        'number.integer' : 'ID группы должен быть целым числом',
        'number.positive' : 'ID группы должен быть положительным числом',
        'number.base' : 'ID группы должен быть числом'
    }))
    .optional()
    .messages({
        'array.base' : 'Множество ID групп должно быть массиво чисел'
    })
});