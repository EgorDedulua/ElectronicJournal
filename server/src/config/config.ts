import { AppError } from '@/utils/appError';
import dotenv from 'dotenv';
import Joi = require('joi');

dotenv.config();

const envSchema = Joi.object({
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('7d')
})
.unknown()
.required();

const { error, value: env } = envSchema.validate(process.env, {
    abortEarly: false
});

if (error) {
    throw new AppError('Ошибка конфигурации окружения', 500);
}

export const config = {
  PORT: env.PORT,
  DATABASE_URL: env.DATABASE_URL as string,
  JWT_SECRET: env.JWT_SECRET as string,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN as string,
};



