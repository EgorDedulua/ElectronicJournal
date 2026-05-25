import Joi from "joi";

export const updateLateSchema = Joi.object({
minutes: Joi.number().min(1).max(45).optional().messages({
        'number.min' : 'Минуты опоздания должны быть числом от 1 до 45',
        'number.max' : 'Минуты опоздания должны быть числом от 1 до 45',
        'number.base' : 'Минуты опоздания должны быть числом'
    })  
});
