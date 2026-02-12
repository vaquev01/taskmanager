import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing User ID' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }

        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // Attach user to request (optional, but good practice)
        (req as any).user = user;
        next();
    } catch (error) {
        console.error('Admin Auth Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const isSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Missing User ID' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Forbidden: Super Admin access required' });
        }

        (req as any).user = user;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
