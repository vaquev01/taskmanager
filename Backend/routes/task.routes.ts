import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { TaskService } from '../services/task.service';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.middleware';
import { USER_SAFE_SELECT } from '../lib/sanitize';

const router = Router();

router.use(authMiddleware);

// Validation schemas
const createTaskSchema = z.object({
    titulo: z.string().min(1, 'Título é obrigatório').max(500),
    descricao: z.string().max(5000).optional().nullable(),
    prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA']).optional().default('MEDIA'),
    prazo: z.string().optional().nullable(),
    criador_id: z.string().min(1, 'criador_id é obrigatório'),
    responsavel_id: z.string().optional().nullable(),
    project_id: z.string().optional().nullable(),
    grupo: z.string().max(100).optional().nullable(),
    subgrupo: z.string().max(100).optional().nullable(),
});

const updateTaskSchema = z.object({
    titulo: z.string().min(1).max(500).optional(),
    descricao: z.string().max(5000).optional().nullable(),
    prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA']).optional(),
    prazo: z.string().optional().nullable(),
    status: z.enum(['PENDENTE', 'EM_PROGRESSO', 'CONCLUIDA']).optional(),
    responsavel_id: z.string().optional().nullable(),
    project_id: z.string().optional().nullable(),
    grupo: z.string().max(100).optional().nullable(),
    subgrupo: z.string().max(100).optional().nullable(),
    subtasks: z.array(z.object({ titulo: z.string(), done: z.boolean() })).optional(),
}).passthrough();

// List all tasks (with pagination)
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
        const skip = (page - 1) * limit;

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    responsavel: { select: USER_SAFE_SELECT },
                    criador: { select: USER_SAFE_SELECT },
                    project: true,
                    subtasks: true,
                    comments: { include: { user: { select: USER_SAFE_SELECT } }, orderBy: { created_at: 'asc' } },
                },
                skip,
                take: limit,
            }),
            prisma.task.count(),
        ]);
        res.json({ data: tasks, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Search tasks (MUST be before /:id to avoid matching 'search' as an ID)
router.get('/search', async (req, res) => {
    try {
        const q = (req.query.q as string) || '';
        const tasks = await prisma.task.findMany({
            where: {
                OR: [
                    { titulo: { contains: q, mode: 'insensitive' } },
                    { descricao: { contains: q, mode: 'insensitive' } },
                    { grupo: { contains: q, mode: 'insensitive' } },
                    { subgrupo: { contains: q, mode: 'insensitive' } },
                ]
            },
            orderBy: { created_at: 'desc' },
            include: { project: true, responsavel: { select: USER_SAFE_SELECT } },
            take: 20,
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search tasks' });
    }
});

// Get task by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                responsavel: { select: USER_SAFE_SELECT },
                criador: { select: USER_SAFE_SELECT },
                project: true,
                subtasks: true,
                comments: { include: { user: { select: USER_SAFE_SELECT } }, orderBy: { created_at: 'asc' } },
            }
        });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// Create task
router.post('/', async (req, res) => {
    try {
        const parsed = createTaskSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        }
        const { titulo, descricao, prioridade, prazo, criador_id, responsavel_id, project_id, grupo, subgrupo } = parsed.data;
        const task = await prisma.task.create({
            data: {
                titulo,
                descricao: descricao || null,
                prioridade: prioridade || 'MEDIA',
                prazo: prazo ? new Date(prazo) : null,
                criador_id,
                responsavel_id: responsavel_id || criador_id,
                project_id: project_id || null,
                grupo: grupo || null,
                subgrupo: subgrupo || null,
                status: 'PENDENTE',
            },
            include: { project: true, responsavel: { select: USER_SAFE_SELECT } }
        });
        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Bulk update tasks
router.post('/bulk', async (req, res) => {
    try {
        const { taskIds, updates } = req.body;
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({ error: 'taskIds array is required' });
        }

        // Convert string date to Date object if present
        if (updates.prazo) {
            updates.prazo = new Date(updates.prazo);
        }

        const taskService = new TaskService();
        await taskService.bulkUpdateTasks(taskIds, updates);

        res.json({ success: true, count: taskIds.length });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ error: 'Failed to bulk update tasks' });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const parsed = updateTaskSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
        }
        const { titulo, descricao, prioridade, prazo, status, responsavel_id, project_id, grupo, subgrupo } = parsed.data;
        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(titulo !== undefined && { titulo }),
                ...(descricao !== undefined && { descricao }),
                ...(prioridade !== undefined && { prioridade }),
                ...(prazo !== undefined && { prazo: prazo ? new Date(prazo) : null }),
                ...(status !== undefined && { status }),
                ...(responsavel_id !== undefined && { responsavel_id }),
                ...(project_id !== undefined && { project_id }),
                ...(grupo !== undefined && { grupo: grupo || null }),
                ...(subgrupo !== undefined && { subgrupo: subgrupo || null }),
                ...(status === 'CONCLUIDA' && { completed_at: new Date() }),
                // Subtasks handling
                ...(req.body.subtasks && {
                    subtasks: {
                        deleteMany: {},
                        create: req.body.subtasks.map((s: any) => ({
                            texto: s.texto,
                            concluida: s.concluida
                        }))
                    }
                }),
            },
            include: { project: true, responsavel: { select: USER_SAFE_SELECT }, subtasks: true, comments: { include: { user: { select: USER_SAFE_SELECT } } } }
        });
        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Toggle task status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({ where: { id } });
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const newStatus = task.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
        const updated = await prisma.task.update({
            where: { id },
            data: {
                status: newStatus,
                completed_at: newStatus === 'CONCLUIDA' ? new Date() : null,
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.task.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
