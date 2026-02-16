import { Router } from 'express';
import webpush from 'web-push';
import { authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// Configure Web Push with VAPID keys
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BJmCsWmcExysXP0fCDSFO4zpqr_BN3HrcGpIU8OPU5LNqzugsuCDGFbnHmBHdlJpy9meXDsykhvR7QabwNoCXbs';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'PSVuNybuLr0JyTpLhOaut3sov3pVyqtLSQ89GqEAgLs';

webpush.setVapidDetails(
    'mailto:support@taskflow.com',
    publicVapidKey,
    privateVapidKey
);

router.use(authMiddleware);

router.post('/subscribe', async (req, res) => {
    const subscription = req.body;
    const userId = req.user?.id;

    if (!userId || !subscription?.endpoint || !subscription?.keys) {
        return res.status(400).json({ error: 'Invalid subscription' });
    }

    try {
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: { user_id: userId, keys_p256dh: subscription.keys.p256dh, keys_auth: subscription.keys.auth },
            create: { user_id: userId, endpoint: subscription.endpoint, keys_p256dh: subscription.keys.p256dh, keys_auth: subscription.keys.auth },
        });
        console.log(`🔔 User ${userId} subscribed to notifications.`);
        res.status(201).json({});
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

router.post('/test', async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({});

    try {
        const subs = await prisma.pushSubscription.findMany({ where: { user_id: userId } });

        if (subs.length === 0) {
            return res.status(404).json({ error: 'No subscription found' });
        }

        const payload = JSON.stringify({
            title: 'TaskFlow Test',
            body: 'This is a test notification from TaskFlow! 🚀'
        });

        await Promise.all(subs.map(sub =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
                payload
            )
        ));
        res.json({ success: true });
    } catch (error) {
        console.error('Push error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

// Helper to send notification to a specific user (exported for other services)
export const sendNotification = async (userId: string, title: string, body: string) => {
    try {
        const subs = await prisma.pushSubscription.findMany({ where: { user_id: userId } });
        if (subs.length === 0) return;

        const payload = JSON.stringify({ title, body });
        await Promise.all(subs.map(sub =>
            webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } },
                payload
            ).catch(e => console.error(e))
        ));
    } catch (error) {
        console.error('sendNotification error:', error);
    }
};

export default router;
