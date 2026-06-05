import Joi from "joi";

export const optionalDeadline = Joi.string()
    .optional()
    .allow('')
    .custom((value, helpers) => {
        if (!value || value.trim() === '') {
            return undefined;
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return helpers.error('date.invalid');
        }
        return date;
    })
    .messages({
        'date.invalid': 'Дедлайн должен быть корректной датой',
    });

export const workSchema = Joi.object({
    title: Joi.string().required().max(200).messages({
        'any.required': 'Тема работы обязательна',
        'string.max': 'Тема работы не может быть длиннее 200 символов',
        'string.base': 'Тема работы должна быть строкой',
    }),
    description: Joi.string().optional().allow('').messages({
        'string.base': 'Описание работы должно быть строкой',
    }),
    deadline: optionalDeadline,
});
