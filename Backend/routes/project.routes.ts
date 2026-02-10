import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

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

export default router;
