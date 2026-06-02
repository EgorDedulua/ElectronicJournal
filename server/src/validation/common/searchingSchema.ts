import Joi from "joi";

export const searchingSchema = Joi.object({
    page: Joi.number().integer().positive().optional().default(1).messages({
        'number.integer' : 'Номер страницы должен быть целым числом',
        'number.positive' : 'Номер страницы должен быть положительным',
        'number.base' : 'Номер страницы должен быть числом'
    }),
    pageSize: Joi.number().integer().positive().optional().default(50).messages({
        'number.integer' : 'Размер страницы должен быть целым числом',
        'number.positive' : 'Размер страницы должен быть положительным числом',
        'number.base' : 'Размер страницы должен быть числом'
    }),
    sort: Joi.string().valid('ASC', 'DESC').optional().default('ASC').messages({
        'any.only' : 'Параметры сортировки могут быть только ASC и DESC',
        'string.base' : 'Параметры сортировки должны быть строковыми'
    }),
    searchString: Joi.string().optional().allow('').messages({
        'string.base' : 'Строка поиска должна представлять собой строковый тип'
    }),
});