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

// Create new user
router.post('/', async (req, res) => {
    try {
        const { nome, email, telefone_whatsapp, avatar, timezone } = req.body;

        // Validation
        if (!nome || !telefone_whatsapp) {
            return res.status(400).json({ error: 'Nome and Whatsapp are required' });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { telefone_whatsapp },
                    { email: email || undefined }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User with this Whatsapp or Email already exists' });
        }

        const user = await prisma.user.create({
            data: {
                nome,
                email,
                telefone_whatsapp,
                avatar,
                timezone: timezone || 'America/Sao_Paulo'
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user (Profile + Config)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone_whatsapp, avatar, timezone, dailySummaryTime } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                nome,
                email,
                telefone_whatsapp,
                avatar,
                timezone,
                dailySummaryTime
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user has tasks/responsibilities
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        tasksResponsible: true,
                        teamsAsAdmin: true
                    }
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Optional: Block delete if has active tasks, or logic to reassign.
        // For now, we'll allow delete but prisma might throw foreign key errors if no cascade is set.
        // Assuming cascade or we want to error out.

        // Safer to just delete. Prisma schema relations usually need specific actions on delete.
        // Let's try simple delete, if it fails due to FK, we'd need to reassign tasks.

        await prisma.user.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user. They might have related tasks.' });
    }
});

export default router;
