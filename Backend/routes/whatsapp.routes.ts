import { Router } from 'express';
import { WhatsappService } from '../services/whatsapp.service';

export const whatsappRouter = (whatsappService: WhatsappService) => {
    const router = Router();

    router.get('/status', (req, res) => {
        res.json({
            isReady: whatsappService.isReady,
            qrCode: whatsappService.qrCode
        });
    });

    router.post('/restart', async (req, res) => {
        await whatsappService.reload();
        res.json({ success: true, message: 'Client restarting...' });
    });

    return router;
};
