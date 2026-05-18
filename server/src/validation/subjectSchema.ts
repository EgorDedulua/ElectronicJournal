import Joi from "joi";

export const subjectSchema = Joi.object({
    name: Joi.string().required().min(2).max(100).messages({
        'any.required' : 'Название группы обязательно',
        'string.min' : 'Название предмета не может быть короче 2 символов',
        'string.max' : 'Название предмета не может быть длиннее 100 символов',
        'string.base' : 'Название предмета должно быть строкой'
    })
});