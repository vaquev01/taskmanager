import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { validateBody } from '../middleware/validate.middleware';
import { loginSchema, createUserSchema } from '../schemas/user.schema';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authService = new AuthService();

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
        const { identifier, password } = req.body;
        const result = await authService.login(identifier, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/register', validateBody(createUserSchema), async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    // efficient way to return user info from token or db
    // req.user is populated by middleware
    res.json({ user: req.user });
});

export default router;
