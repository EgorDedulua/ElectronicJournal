import Joi from "joi";

export const registerSchema = Joi.object({
    login: Joi.string().required().min(4).max(100).messages({
        'any.required' : 'Логин обязателен',
        'string.min' : 'Логин не может быть короче 4 символов',
        'string.max' : 'Логин не может быть длиннее 100 символов',
        'string.base' : 'Логин должен быть строкой',
    }),
    password: Joi.string().required().min(6).max(100).messages({
        'any.required' : 'Пароль обязателен',
        'string.min' : 'Пароль не может быть короче 6 символов',
        'string.max' : 'Пароль не может быть длиннее 100 символов',
        'string.base' : 'Пароль должен быть строкой',
    }),
    fullName: Joi.string().required().min(2).messages({
        'any.reqired' : 'Полное имя обязательно',
        'string.min' : 'Полное имя не может быть короче 2 символов',
        'string.base' : 'Полное имя должно быть строкой'
    }),
    groupId: Joi.number().message('Id группы должно быть числом'),
    role: Joi.string().required().valid('student', 'teacher').messages({
        'any.required' : 'Роль обязательна',
        'any.only': 'Роль должна быть student или teacher',
        'string.base' : 'Роль должна быть строкой'
    })
});