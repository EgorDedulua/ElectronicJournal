import Joi from "joi";

export const usersQuerySchema = Joi.object({
    role: Joi.string().valid('student', 'admin', 'teacher').optional().messages({
        'any.only' : 'Роли могут быть только student, admin, teacher',
        'string.base' : 'Роль должна быть строкой'
    }),
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