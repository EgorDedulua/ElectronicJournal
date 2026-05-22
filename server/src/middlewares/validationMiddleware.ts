import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (
    schema: Joi.Schema,
    target: ValidationTarget = 'body'
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req[target], {
            abortEarly: false,
            stripUnknown: false,
            allowUnknown: target === 'query' 
        });

        if (error) {
            const message = error.details.map(d => d.message).join(', ');
            return res.status(400).json({ error: message })
        }

        req[target] = value;
        next();
    }
}