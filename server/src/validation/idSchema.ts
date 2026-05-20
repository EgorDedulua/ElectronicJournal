import Joi from "joi";

export const idSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base' : 'ID должен быть числом',
        'number.integer' : 'ID должен быть целым числом',
        'number.positive' : 'ID должен быть положительным',
        'any.required' : 'ID обязателен'
    })
});