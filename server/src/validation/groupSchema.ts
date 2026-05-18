import Joi from "joi";

export const groupSchema = Joi.object({
    name: Joi.string().required().min(3).max(100).messages({
        'any.required' : 'Название группы не может быть пустым',
        'string.min' : 'Название группы не может быть короче 3 символов',
        'string.max' : 'Название группы не может быть длиннее 100 символов',
        'string.base' : 'Название группы должно быть строкой'
    })
});