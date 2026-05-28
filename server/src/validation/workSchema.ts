import Joi from "joi";

export const workSchema = Joi.object({
    title: Joi.string().required().max(200).messages({
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
});