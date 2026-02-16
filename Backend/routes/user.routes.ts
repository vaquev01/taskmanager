import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';
import { validateBody } from '../middleware/validate.middleware';
import { stripPassword, stripPasswords } from '../lib/sanitize';

const router = Router();

router.use(authMiddleware);

// List all users (with pagination)
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                orderBy: { nome: 'asc' },
                include: {
                    _count: {
                        select: {
                            tasksCreated: true,
                            tasksResponsible: true,
                        }
                    }
                },
                skip,
                take: limit,
            }),
            prisma.user.count(),
        ]);
        res.json({ data: stripPasswords(users), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
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
        res.json(stripPassword(user));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }

});

// Create new user
router.post('/', validateBody(createUserSchema), async (req, res) => {
    try {
        const { nome, email, telefone_whatsapp, avatar, timezone } = req.body;

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

        res.status(201).json(stripPassword(user));
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user (Profile + Config)
router.put('/:id', validateBody(updateUserSchema), async (req, res) => {
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

        res.json(stripPassword(user));
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
