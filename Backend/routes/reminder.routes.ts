import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// Get reminders for a user (query param ?userId=...)
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId is required' });

        const reminders = await prisma.reminder.findMany({
            where: {
                user_id: String(userId),
                enviado: false
            },
            include: { task: true },
            orderBy: { horario: 'asc' }
        });

        res.json(reminders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Delete a reminder
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.reminder.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
});

export default router;
