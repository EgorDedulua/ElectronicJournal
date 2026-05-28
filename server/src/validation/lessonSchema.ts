import Joi from "joi";

export const lessonSchema = Joi.object({
    date: Joi.date().iso().required().messages({
        'date.iso' : 'Дата должна быть в формате iso',
        'date.base' : 'Дата урока должна быть в корректном формате даты (iso)',
        'any.required' : 'Дата обязательна'
    }),
    topic: Joi.string().optional().messages({
        'string.base' : 'Тема должна быть строкой'
    }),
    type: Joi.string().valid('usual', 'lab', 'practice', 'test', 'control').required().messages({
        'any.required' : 'Тип урока обязателен',
        'any.only' : 'Допустимы типы уроков: usual, lab, practice, test, control',
        'string.base' : 'Тип урока должен быть строкой'
    })
});