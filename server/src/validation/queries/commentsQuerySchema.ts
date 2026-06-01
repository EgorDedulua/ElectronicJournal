import Joi from "joi";

export const commentsQuerySchema = Joi.object({
    offset: Joi.number().integer().min(0).optional().default(0).messages({
        'base.number' : 'Offset должен быть числом',
        'number.min' : 'Offset не может быть меньше 0',
        'number.integer' : 'Offset должен быть целым числом'
    }),
    limit: Joi.number().integer().min(1).max(100).optional().default(20).messages({
        'base.number' : 'Limit должен быть числом',
        'number.min' : 'Limit должен быть от 1 до 100',
        'number.max' : 'Limit должен быть от 1 до 100',
        'number.integer' : 'Limit должен быть целым числом'
    }),
});