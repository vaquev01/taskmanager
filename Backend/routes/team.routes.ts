import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// Schema for creating/updating team
const teamSchema = z.object({
    nome: z.string().min(1, "Nome is required"),
    admin_id: z.string().uuid("Admin ID must be a valid UUID").optional() // Optional for now
});

// List all teams with members
router.get('/', async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: {
                members: {
                    include: {
                        user: true
                    }
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: { nome: 'asc' }
        });
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Create new team
router.post('/', async (req, res) => {
    try {
        const { nome, admin_id } = teamSchema.parse(req.body);

        // For now, if no admin_id provided, pick first user or error? 
        // Schema says admin_id is required. We should probably require it or pick a default system admin if applicable.
        // Let's check schema again. `admin_id String`. `admin User`.
        // So we MUST provide a valid user ID as admin.

        // If frontend doesn't send admin_id, we might need a fallback.
        // For simplicity, let's assume the frontend sends the ID of the current user invoking the action, or we pick one.
        // Or we make the schema allow nullable if we change the DB, but we can't change DB easily right now.
        // Let's assume we pass the first available user if not provided, for robustness, or fail.

        let validAdminId = admin_id;
        if (!validAdminId) {
            const anyUser = await prisma.user.findFirst();
            if (anyUser) validAdminId = anyUser.id;
            else return res.status(400).json({ error: 'No users available to be admin' });
        }

        const team = await prisma.team.create({
            data: {
                nome,
                admin_id: validAdminId!
            }
        });

        res.status(201).json(team);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Update team
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, admin_id } = req.body; // Loose validation for update

        const team = await prisma.team.update({
            where: { id },
            data: {
                nome,
                admin_id // Only update if provided
            }
        });

        res.json(team);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Delete team
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if has members? Maybe move them to unassigned (delete TeamMember rows).
        // OnDelete rules?
        // Let's manually delete members first to be safe, if we want to "release" them.

        await prisma.teamMember.deleteMany({
            where: { team_id: id }
        });

        await prisma.team.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// Move member logic (Exclusive membership for Hierarchy View)
router.post('/move-member', async (req, res) => {
    try {
        const { userId, targetTeamId } = req.body;

        if (!userId) return res.status(400).json({ error: 'userId required' });

        // 1. Remove from ALL existing teams (to enforce exclusive hierarchy)
        await prisma.teamMember.deleteMany({
            where: { user_id: userId }
        });

        // 2. If targetTeamId provided, add to that team
        if (targetTeamId) {
            await prisma.teamMember.create({
                data: {
                    user_id: userId,
                    team_id: targetTeamId,
                    // role: 'MEMBER' // Role not in schema yet
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Move member error:', error);
        res.status(500).json({ error: 'Failed to move member' });
    }
});

export default router;
