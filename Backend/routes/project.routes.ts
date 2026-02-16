import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// List all projects
router.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { created_at: 'desc' },
            include: {
                team: true,
                _count: { select: { tasks: true } }
            }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Create project
router.post('/', async (req, res) => {
    try {
        const { nome, team_id, cor, creator_id } = req.body;
        if (!nome || !team_id) {
            return res.status(400).json({ error: 'nome and team_id are required' });
        }
        const project = await prisma.project.create({
            data: { nome, team_id, cor: cor || '#8b5cf6', creator_id }
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, cor, team_id } = req.body;
        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(nome !== undefined && { nome }),
                ...(cor !== undefined && { cor }),
                ...(team_id !== undefined && { team_id }),
            }
        });
        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Unlink tasks from project before deleting
        await prisma.task.updateMany({
            where: { project_id: id },
            data: { project_id: null }
        });
        await prisma.project.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
