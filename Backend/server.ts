import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import adminRoutes from './routes/admin.routes';
import { WhatsappService } from './services/whatsapp.service';
import { whatsappRouter } from './routes/whatsapp.routes';
import { CronService } from './services/cron.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize Services
console.log('🔄 Initializing Services...');
const whatsappService = new WhatsappService();
const cronService = new CronService(whatsappService);

// Routes
console.log('🔄 Setting up Routes...');
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRouter(whatsappService));
app.use('/api', apiRoutes); // General API routes last

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'TaskFlow API is running 🚀', timestamp: new Date(), whatsapp: whatsappService.isReady ? 'CONNECTED' : 'DISCONNECTED' });
});

import { prisma } from './lib/prisma';

async function ensureAdminUser() {
    try {
        const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        if (!admin) {
            console.log('⚠️ Super Admin not found. Creating default "Wardogs" user...');
            await prisma.user.create({
                data: {
                    nome: 'Wardogs',
                    telefone_whatsapp: '5511999999999',
                    email: 'admin@wardogs.com',
                    avatar: 'https://i.pravatar.cc/150?u=master',
                    role: 'SUPER_ADMIN'
                }
            });
            console.log('✅ Super Admin "Wardogs" created successfully.');
        } else {
            console.log('✅ Super Admin exists.');
        }
    } catch (error) {
        console.error('❌ Error ensuring admin user:', error);
    }
}

// Start Server
app.listen(PORT, async () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);

    // Start Services after server is listening
    try {
        await ensureAdminUser(); // Ensure Admin exists
        await whatsappService.initialize();
        cronService.start();
        console.log('✅ All services started successfully');
    } catch (error) {
        console.error('❌ Error starting services:', error);
    }
});
