import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Services
import { WhatsappService } from './services/whatsapp.service';
import { whatsappRouter } from './routes/whatsapp.routes';

import { CronService } from './services/cron.service';

const whatsappService = new WhatsappService();
whatsappService.initialize();

const cronService = new CronService(whatsappService);
cronService.start();

// Routes
// Routes
// app.use('/api', apiRoutes); // Moved up
app.use('/api/whatsapp', whatsappRouter(whatsappService));

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'TaskFlow API is running 🚀', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
