import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-this';

interface TokenPayload {
    id: string;
    role: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(new AppError('Token não fornecido', 401));
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
        return next(new AppError('Token mal formatado', 401));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch (err) {
        return next(new AppError('Token inválido ou expirado', 401));
    }
};
