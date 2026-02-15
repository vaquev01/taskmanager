import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './error.middleware';

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map((e) => e.message).join(', ');
            return next(new AppError(errorMessage, 400));
        }
        return next(new AppError('Erro de validação desconhecido', 400));
    }
};

// Simplified version that only validates body if the schema is just the body shape
// But usually schemas are full objects. Let's assume schema matches body.
// Actually, Zod schema usually defines the whole object structure.
// If my schemas in user.schema.ts are just for body, I should wrap them.

export const validateBody = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errorMessage = error.errors.map((e) => e.message).join(', ');
            return next(new AppError(errorMessage, 400));
        }
        return next(new AppError('Erro de validação desconhecido', 400));
    }
};
