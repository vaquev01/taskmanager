import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAdmin, isSuperAdmin } from '../middleware/admin.middleware';

const router = Router();
const prisma = new PrismaClient();

// Global Stats (Super Admin)
router.get('/stats', isSuperAdmin, async (req, res) => {
    try {
        const [
            totalUsers,
            totalTasks,
            activeTasks,
            totalTeams,
            totalProjects
        ] = await Promise.all([
            prisma.user.count(),
            prisma.task.count(),
            prisma.task.count({ where: { status: { not: 'CONCLUIDA' } } }),
            prisma.team.count(),
            prisma.project.count()
        ]);

        res.json({
            users: totalUsers,
            tasks: {
                total: totalTasks,
                active: activeTasks
            },
            teams: totalTeams,
            projects: totalProjects
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// User Management (Admin)
router.get('/users', isAdmin, async (req, res) => {
    const users = await prisma.user.findMany({
        orderBy: { created_at: 'desc' },
        take: 50
    });
    res.json(users);
});

export default router;
