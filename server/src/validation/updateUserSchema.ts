import Joi from "joi";

export const updateUserSchema = Joi.object({
    login: Joi.string().required().min(4).max(100).optional().messages({
        'string.min' : 'Логин не может быть короче 4 символов',
        'string.max' : 'Логин не может быть длиннее 100 символов',
        'string.base' : 'Логин должен быть строкой',
    }),
    password: Joi.string().required().min(6).max(100).optional().messages({
        'string.min' : 'Пароль не может быть короче 6 символов',
        'string.max' : 'Пароль не может быть длиннее 100 символов',
        'string.base' : 'Пароль должен быть строкой',
    }),
    fullName: Joi.string().required().min(2).optional().messages({
        'string.min' : 'Полное имя не может быть короче 2 символов',
        'string.base' : 'Полное имя должно быть строкой'
    }),
    groupId: Joi.number().optional().messages({
        'number.base' : 'Id группы должно быть числом'
    }),
    role: Joi.string().required().valid('student', 'teacher').optional().messages({
        'any.only': 'Роль должна быть student или teacher',
        'string.base' : 'Роль должна быть строкой'
    })
});