import { Router } from 'express';
import webpush from 'web-push';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Configure Web Push with VAPID keys (Should be in ENV, but using generated ones for now)
const publicVapidKey = 'BJmCsWmcExysXP0fCDSFO4zpqr_BN3HrcGpIU8OPU5LNqzugsuCDGFbnHmBHdlJpy9meXDsykhvR7QabwNoCXbs';
const privateVapidKey = 'PSVuNybuLr0JyTpLhOaut3sov3pVyqtLSQ89GqEAgLs';

webpush.setVapidDetails(
    'mailto:support@taskflow.com',
    publicVapidKey,
    privateVapidKey
);

router.use(authMiddleware);

// Store subscriptions in memory for now (MVP). Ideally in DB (User model).
// Map<userId, Subscription[]>
const subscriptions: Map<string, any[]> = new Map();

router.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const userId = req.user?.id;

    if (!userId || !subscription) {
        return res.status(400).json({ error: 'Invalid subscription' });
    }

    const userSubs = subscriptions.get(userId) || [];
    userSubs.push(subscription);
    subscriptions.set(userId, userSubs);

    console.log(`🔔 User ${userId} subscribed to notifications.`);
    res.status(201).json({});
});

router.post('/test', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({});

    const userSubs = subscriptions.get(userId) || [];

    if (userSubs.length === 0) {
        return res.status(404).json({ error: 'No subscription found' });
    }

    const payload = JSON.stringify({
        title: 'TaskFlow Test',
        body: 'This is a test notification from TaskFlow! 🚀'
    });

    try {
        await Promise.all(userSubs.map(sub => webpush.sendNotification(sub, payload)));
        res.json({ success: true });
    } catch (error) {
        console.error('Push error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Helper to send notification to a specific user (exported for other services)
export const sendNotification = async (userId: string, title: string, body: string) => {
    const userSubs = subscriptions.get(userId) || [];
    if (userSubs.length === 0) return;

    const payload = JSON.stringify({ title, body });
    userSubs.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(e => console.error(e));
    });
};

export default router;
