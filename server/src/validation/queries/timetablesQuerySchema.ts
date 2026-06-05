import { idField } from '@/utils/idValidation';
import Joi from 'joi';

export const timetablesQuerySchema = Joi.object({
    id: idField().messages({
        'any.required': 'ID группы обязателен',
    }),
});
