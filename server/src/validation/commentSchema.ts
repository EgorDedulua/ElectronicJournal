import { idField } from "@/utils/idValidation";
import Joi from "joi";

export const commentsSchema = Joi.object({
    text: Joi.string().max(500).required().messages({
        'base.string' : 'Текст должен быть строкой',
        'string.max' : 'Текст не может быть длиннее 500 символов',
        'any.required' : 'Текст комментария обязателен'
    }),
    parentId: idField().optional()
});