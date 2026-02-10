import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// List all users
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { nome: 'asc' },
            include: {
                _count: {
                    select: {
                        tasksCreated: true,
                        tasksResponsible: true,
                    }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                teamsAsMember: { include: { team: true } },
                _count: {
                    select: {
                        tasksCreated: true,
                        tasksResponsible: true,
                    }
                }
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }

});

// Update user config
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { timezone, dailySummaryTime } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { timezone, dailySummaryTime }
        });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

export default router;
