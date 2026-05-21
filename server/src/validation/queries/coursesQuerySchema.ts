import Joi from "joi";

export const coursesQuerySchema = Joi.object({
    groupIds: Joi.array().items(Joi.number().integer().positive().messages({
        'number.integer' : 'ID группы должен быть целым числом',
        'number.positive' : 'ID группы должен быть положительным числом',
        'number.base' : 'ID группы должен быть числом'
    })),
    subjectds: Joi.array().items(Joi.number().integer().positive().messages({
        'number.integer' : 'ID предмета должен быть целым числом',
        'number.positive' : 'ID предмета должен быть положительным числом',
        'number.base' : 'ID предмета должен быть числом'
    }))
});