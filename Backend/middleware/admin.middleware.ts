import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from './auth.middleware';

export const isAdmin = [
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: Token inválido' });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized: User not found' });
            }

            if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Forbidden: Admin access required' });
            }

            next();
        } catch (error) {
            console.error('Admin Auth Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
];

export const isSuperAdmin = [
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized: Token inválido' });
            }

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || user.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
            }

            next();
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
];
