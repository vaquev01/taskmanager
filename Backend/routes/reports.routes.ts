import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { Parser } from 'json2csv';

const router = Router();

router.use(authMiddleware);

router.get('/tasks/csv', async (req, res) => {
    try {
        const userId = req.user?.id;

        const tasks = await prisma.task.findMany({
            where: {
                responsavel_id: userId
            },
            orderBy: { created_at: 'desc' }
        });

        const fields = ['id', 'titulo', 'descricao', 'status', 'prioridade', 'created_at', 'updated_at'];
        const opts = { fields };

        try {
            const parser = new Parser(opts);
            const csv = parser.parse(tasks);

            res.header('Content-Type', 'text/csv');
            res.attachment('tasks-report.csv');
            return res.send(csv);

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to generate CSV' });
        }

    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

export default router;
