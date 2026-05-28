import Joi from 'joi';

export const paramsSchema = Joi.object()
  .pattern(
    Joi.string(),                          
    Joi.number().integer().positive()
  )
  .messages({
    'object.pattern': 'Параметр {{#key}} должен быть положительным целым числом',
    'number.base': 'Параметр {{#key}} должен быть числом',
    'number.integer': 'Параметр {{#key}} должен быть целым',
    'number.positive': 'Параметр {{#key}} должен быть больше нуля',
  });