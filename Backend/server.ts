import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';
import searchRoutes from './routes/search.routes';
import notificationsRoutes from './routes/notifications.routes';
import reportsRoutes from './routes/reports.routes';
import { WhatsappService } from './services/whatsapp.service';
import { whatsappRouter } from './routes/whatsapp.routes';
import { CronService } from './services/cron.service';
import { errorHandler } from './middleware/error.middleware';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:5173'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Rate Limiter (skip whatsapp/status which has its own limiter)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/api/whatsapp'),
    message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
app.use('/api', globalLimiter);

// Specific Auth Limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20, // 20 login attempts per hour
    message: { error: 'Muitas tentativas de login, tente novamente em 1 hora.' }
});
app.use('/api/auth/login', authLimiter);

// Specific WhatsApp Limiter (relaxed for polling)
const whatsappLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60, // 1 request per second average
    message: { error: 'Muitas requisições ao WhatsApp, aguarde.' }
});
app.use('/api/whatsapp', whatsappLimiter);

// Initialize Services
console.log('🔄 Initializing Services...');
const whatsappService = new WhatsappService();
const cronService = new CronService(whatsappService);

// Export for use in dispatch routes
export function getWhatsappService() { return whatsappService; }

// Routes
console.log('🔄 Setting up Routes...');
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRouter(whatsappService));
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', apiRoutes); // General API routes last

// Error Handler (Must be last)
app.use(errorHandler);

// Health Check
app.get('/health', (req, res) => {
    res.json({ message: 'TaskFlow API is running 🚀', timestamp: new Date(), whatsapp: whatsappService.isReady ? 'CONNECTED' : 'DISCONNECTED' });
});

// Serve Static Frontend (Production)
// In production (built), __dirname is '.../Backend/dist'
// We copied frontend to '.../Backend/public'
const prodPublicPath = path.join(__dirname, '../public');
const devPublicPath = path.join(__dirname, '../../Frontend/dist'); // Fallback for local testing if not copied

const finalPublicPath = fs.existsSync(prodPublicPath) ? prodPublicPath : devPublicPath;

if (fs.existsSync(finalPublicPath)) {
    console.log(`📂 Serving static files from: ${finalPublicPath}`);
    app.use(express.static(finalPublicPath));

    app.get('*', (req, res) => {
        res.sendFile(path.join(finalPublicPath, 'index.html'));
    });
} else {
    console.log('⚠️ Static frontend not found. API Mode only.');
}

async function ensureAdminUser() {
    try {
        const adminEmail = 'admin@wardogs.com';
        const adminPhone = '5511999999999';
        const defaultPassword = 'wardogs';

        // Check if admin exists by email or phone
        const admin = await prisma.user.findFirst({
            where: {
                OR: [
                    { role: 'SUPER_ADMIN' },
                    { email: adminEmail }
                ]
            }
        });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(defaultPassword, salt);

        if (!admin) {
            console.log('⚠️ Super Admin not found. Creating default "Wardogs" user...');
            await prisma.user.create({
                data: {
                    nome: 'Wardogs',
                    telefone_whatsapp: adminPhone,
                    email: adminEmail,
                    password_hash: hash,
                    avatar: 'https://i.pravatar.cc/150?u=master',
                    role: 'SUPER_ADMIN'
                }
            });
            console.log(`✅ Super Admin created. Login: ${adminEmail} / Pass: ${defaultPassword}`);
        } else {
            // Only set password if user has no password configured
            if (!admin.password_hash) {
                await prisma.user.update({
                    where: { id: admin.id },
                    data: { password_hash: hash }
                });
                console.log('✅ Admin password initialized (was empty).');
            } else {
                console.log('✅ Super Admin already exists with password configured.');
            }
        }
    } catch (error) {
        console.error('❌ Error ensuring admin user:', error);
    }
}

// Start Server
const server = app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);

    try {
        await ensureAdminUser();
        await whatsappService.initialize();
        cronService.start();
        console.log('✅ All services started successfully');
    } catch (error) {
        console.error('❌ Error starting services:', error);
    }
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected. Process exiting.');
        process.exit(0);
    });
    setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
