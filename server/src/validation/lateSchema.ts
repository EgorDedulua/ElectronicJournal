import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const lateSchema = Joi.object({
    minutes: Joi.number().min(1).max(45).required().messages({
        'any.required' : 'Минуты опоздания обязательны',
        'number.min' : 'Минуты опоздания должны быть числом от 1 до 45',
        'number.max' : 'Минуты опоздания должны быть числом от 1 до 45',
        'number.base' : 'Минуты опоздания должны быть числом'
    }),
    studentId: idField()
});