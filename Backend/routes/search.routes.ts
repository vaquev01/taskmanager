import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const query = req.query.q as string;
        const userId = req.user?.id;

        if (!query || query.length < 2) {
            return res.json({ tasks: [], users: [] });
        }

        const [tasks, users] = await Promise.all([
            prisma.task.findMany({
                where: {
                    AND: [
                        {
                            OR: [
                                { titulo: { contains: query, mode: 'insensitive' } },
                                { descricao: { contains: query, mode: 'insensitive' } }
                            ]
                        },
                        {
                            // Visibility filter
                            OR: [
                                { responsavel_id: userId },
                                { criador_id: userId }
                            ]
                        }
                    ]
                },
                take: 5,
                select: { id: true, titulo: true, status: true }
            }),
            prisma.user.findMany({
                where: {
                    OR: [
                        { nome: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, nome: true, avatar: true }
            })
        ]);

        res.json({ tasks, users });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
