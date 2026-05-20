import Joi from "joi";

export const loginSchema = Joi.object({
    login: Joi.string().required().messages({
        'any.required' : 'Логин обязателен',
        'string.base' : 'Логин должен быть строкой'
    }),
    password: Joi.string().required().messages({
        'any.required' : 'Пароль обязателен',
        'string.base' : 'Пароль должен быть строкой'
    })
});