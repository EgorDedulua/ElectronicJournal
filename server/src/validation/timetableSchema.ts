import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const timetableSchema = Joi.object({
    courseId: idField(),
    dayOfWeek: Joi.number().min(1).max(7).integer().required().messages({
        'any.required' : 'День недели обязателен',
        'number.base' : 'День недели должен передаваться в виде числа',
        'number.integer' : 'День недели должен передаваться в виде целого чисоа',
        'number.min' : 'День недели должен быть числом от 1 до 7',
        'number.max' : 'День недели должен быть числом от 1 до 7'
    }),
    room: Joi.string().max(50).required().messages({
        'any.required' : 'Кабинет обязателен',
        'string.base' : 'Кабинет должен быть строкой',
        'string.max' : 'Кабинет не может быть длиннее 50 символов'
    }),
    lessonNumber: Joi.number().integer().min(1).max(13).required().messages({
        'any.required' : 'Номер урока обязателен',
        'number.integer' : 'Номер урока должен быть целым числом',
        'number.min' : 'Номер урока должен быть числом от 1 до 13',
        'number.max' : 'Номер урока должен быть числом от 1 до 13',
        'number.base' : 'Номер урока должен быть числом'
    })
});

export const timetableArraySchema = Joi.array().items(timetableSchema).min(1).required().messages({
    'array.base' : 'Тело запроса должно быть массивом',
    'array.min' : 'Массив не должен быть пустым',
    'any.required' : 'Массив шаблонов расписания обязателен'
});
