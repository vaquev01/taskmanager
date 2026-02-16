import { Router } from 'express';
import taskRoutes from './task.routes';
import projectRoutes from './project.routes';
import userRoutes from './user.routes';
import reminderRoutes from './reminder.routes';
import teamRoutes from './team.routes';
import dispatchRoutes from './dispatch.routes';
import commentRoutes from './comment.routes';

const router = Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

router.use('/tasks', taskRoutes);
router.use('/projects', projectRoutes);
router.use('/users', userRoutes);
router.use('/reminders', reminderRoutes);
router.use('/teams', teamRoutes);
router.use('/dispatch', dispatchRoutes);
router.use('/comments', commentRoutes);

export default router;
