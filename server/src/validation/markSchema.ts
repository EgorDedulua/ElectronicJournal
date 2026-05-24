import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const markSchema = Joi.object({
    studentId: idField(),
    mark: Joi.number().min(1).max(10).required().messages({
        'any.required' : 'Оценка обязательна',
        'number.min' : 'Оценка должна быть числом от 1 до 10',
        'number.max' : 'Оценка должна быть числом от 1 до 10',
        'number.base' : 'Оценка должна быть числом'
    })
});