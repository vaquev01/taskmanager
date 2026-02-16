import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * POST /dispatch/preview
 * Returns matching users and tasks based on filters
 */
router.post('/preview', async (req, res) => {
    try {
        const {
            userIds,        // string[] — specific user IDs
            teamIds,        // string[] — filter by team membership
            taskStatuses,   // string[] — PENDENTE, EM_PROGRESSO, CONCLUIDA
            grupos,         // string[] — filter by task.grupo
            subgrupos,      // string[] — filter by task.subgrupo
            taskIds,        // string[] — specific task IDs
            priorities,     // string[] — ALTA, MEDIA, BAIXA
        } = req.body;

        // Build user filter
        const userWhere: any = {};

        if (userIds?.length) {
            userWhere.id = { in: userIds };
        }

        if (teamIds?.length) {
            userWhere.teamsAsMember = {
                some: { team_id: { in: teamIds } }
            };
        }

        // Get matching users
        const users = await prisma.user.findMany({
            where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
            select: {
                id: true,
                nome: true,
                telefone_whatsapp: true,
                email: true,
                timezone: true,
            }
        });

        const userIdList = users.map(u => u.id);

        // Build task filter
        const taskWhere: any = {
            OR: [
                { responsavel_id: { in: userIdList } },
                { criador_id: { in: userIdList } }
            ]
        };

        if (taskStatuses?.length) {
            taskWhere.status = { in: taskStatuses };
        }
        if (grupos?.length) {
            taskWhere.grupo = { in: grupos };
        }
        if (subgrupos?.length) {
            taskWhere.subgrupo = { in: subgrupos };
        }
        if (taskIds?.length) {
            taskWhere.id = { in: taskIds };
        }
        if (priorities?.length) {
            taskWhere.prioridade = { in: priorities };
        }

        const tasks = await prisma.task.findMany({
            where: taskWhere,
            include: {
                responsavel: { select: { id: true, nome: true, telefone_whatsapp: true } },
                criador: { select: { id: true, nome: true } },
                project: { select: { nome: true } }
            },
            orderBy: { prazo: 'asc' }
        });

        // Get all unique grupos and subgrupos for filter dropdowns
        const allGrupos = await prisma.task.findMany({
            where: { grupo: { not: null } },
            select: { grupo: true },
            distinct: ['grupo']
        });
        const allSubgrupos = await prisma.task.findMany({
            where: { subgrupo: { not: null } },
            select: { subgrupo: true },
            distinct: ['subgrupo']
        });

        res.json({
            users,
            tasks,
            meta: {
                totalUsers: users.length,
                totalTasks: tasks.length,
                availableGrupos: allGrupos.map(g => g.grupo).filter(Boolean),
                availableSubgrupos: allSubgrupos.map(g => g.subgrupo).filter(Boolean),
            }
        });
    } catch (error) {
        console.error('Dispatch preview error:', error);
        res.status(500).json({ error: 'Failed to build preview' });
    }
});

/**
 * POST /dispatch/send
 * Sends WhatsApp messages to filtered recipients
 */
router.post('/send', async (req, res) => {
    try {
        const {
            recipients,  // { userId, phone, name, taskTitles }[]
            template,    // message template with {nome}, {tarefas}, {prazo}
            customMessage // optional raw message override
        } = req.body;

        if (!recipients?.length) {
            return res.status(400).json({ error: 'No recipients provided' });
        }

        // We'll import the whatsapp service instance from the server
        const { getWhatsappService } = await import('../server');
        const whatsapp = getWhatsappService();

        if (!whatsapp || !whatsapp.isReady) {
            return res.status(503).json({ error: 'WhatsApp não está conectado' });
        }

        const results: { user: string; status: string }[] = [];

        for (const r of recipients) {
            try {
                let message = customMessage || template || '';

                // Replace template variables
                message = message.replace(/\{nome\}/g, r.name || '');
                message = message.replace(/\{tarefas\}/g, (r.taskTitles || []).join('\n▫️ '));
                message = message.replace(/\{total\}/g, String(r.taskTitles?.length || 0));

                const phone = r.phone.includes('@') ? r.phone : `${r.phone}@c.us`;
                await whatsapp.sendMessage(phone, message);

                results.push({ user: r.name, status: 'sent' });
            } catch (err: any) {
                results.push({ user: r.name, status: `error: ${err.message}` });
            }
        }

        res.json({
            sent: results.filter(r => r.status === 'sent').length,
            errors: results.filter(r => r.status !== 'sent').length,
            details: results
        });
    } catch (error) {
        console.error('Dispatch send error:', error);
        res.status(500).json({ error: 'Failed to send messages' });
    }
});

/**
 * GET /dispatch/filters
 * Returns available filter options
 */
router.get('/filters', async (req, res) => {
    try {
        const [teams, users, grupos, subgrupos] = await Promise.all([
            prisma.team.findMany({
                select: { id: true, nome: true, _count: { select: { members: true } } },
                orderBy: { nome: 'asc' }
            }),
            prisma.user.findMany({
                select: { id: true, nome: true, telefone_whatsapp: true },
                orderBy: { nome: 'asc' }
            }),
            prisma.task.findMany({
                where: { grupo: { not: null } },
                select: { grupo: true },
                distinct: ['grupo']
            }),
            prisma.task.findMany({
                where: { subgrupo: { not: null } },
                select: { subgrupo: true },
                distinct: ['subgrupo']
            })
        ]);

        res.json({
            teams: teams.map(t => ({ id: t.id, nome: t.nome, memberCount: t._count.members })),
            users,
            grupos: grupos.map(g => g.grupo).filter(Boolean),
            subgrupos: subgrupos.map(g => g.subgrupo).filter(Boolean),
            statuses: ['PENDENTE', 'EM_PROGRESSO', 'CONCLUIDA'],
            priorities: ['ALTA', 'MEDIA', 'BAIXA'],
        });
    } catch (error) {
        console.error('Dispatch filters error:', error);
        res.status(500).json({ error: 'Failed to load filters' });
    }
});

export default router;
