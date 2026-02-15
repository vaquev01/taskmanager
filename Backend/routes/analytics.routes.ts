import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Get Weekly Completion Stats (Last 7 days or current week)
router.get('/weekly-completion', async (req, res) => {
    try {
        const userId = req.user?.id;
        const now = new Date();
        // Get start of week (Sunday or Monday, let's say Monday)
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const tasks = await prisma.task.findMany({
            where: {
                responsavel_id: userId,
                updated_at: {
                    gte: startOfWeek
                },
                status: 'CONCLUIDA'
            },
            select: {
                updated_at: true
            }
        });

        // Group by day of week
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        const stats = days.map((label, index) => {
            // 0=Dom, 1=Seg...
            // Our days array matches getDay() index
            return {
                name: label,
                concluidas: tasks.filter(t => new Date(t.updated_at).getDay() === index).length
            };
        });

        // Reorder to start on Mon if desired, but 0-6 matches JS getDay() perfectly with Dom as 0.
        // Let's keep Dom-Sab.

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch weekly stats' });
    }
});

// Get Task Distribution by Priority
router.get('/distribution', async (req, res) => {
    try {
        const userId = req.user?.id;

        const distribution = await prisma.task.groupBy({
            by: ['prioridade'],
            where: {
                responsavel_id: userId,
                status: { not: 'CONCLUIDA' } // Only active tasks? Or all? Let's say Active.
            },
            _count: {
                _all: true
            }
        });

        const formatted = distribution.map(item => ({
            name: item.prioridade,
            value: item._count._all
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch distribution' });
    }
});

export default router;
