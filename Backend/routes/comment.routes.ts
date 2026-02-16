import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createCommentSchema = z.object({
    texto: z.string().min(1, 'Texto é obrigatório').max(2000),
    user_id: z.string().uuid(),
});

// List comments for a task
router.get('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { task_id: taskId },
            include: { user: { select: { id: true, nome: true, avatar: true } } },
            orderBy: { created_at: 'asc' }
        });
        res.json(comments);
    } catch (error) {
        console.error('Fetch comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Create comment on a task
router.post('/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const parsed = createCommentSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        }
        const { texto, user_id } = parsed.data;
        const comment = await prisma.comment.create({
            data: { texto, user_id, task_id: taskId },
            include: { user: { select: { id: true, nome: true, avatar: true } } }
        });
        res.status(201).json(comment);
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// Delete comment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.comment.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

export default router;
