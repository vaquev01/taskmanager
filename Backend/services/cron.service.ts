import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { WhatsappService } from './whatsapp.service';

export class CronService {
    private whatsappService: WhatsappService;

    constructor(whatsappService: WhatsappService) {
        this.whatsappService = whatsappService;
    }

    public start() {
        console.log('⏰ Cron Service Started');

        // Check for reminders every minute
        cron.schedule('* * * * *', async () => {
            await this.checkReminders();
            // Check summaries as well
            await this.checkDailySummaries();
        });
    }

    private async checkReminders() {
        try {
            const now = new Date();
            const oneMinuteLater = new Date(now.getTime() + 60 * 1000);

            // 1. Specific Reminders (User customized)
            const reminders = await prisma.reminder.findMany({
                where: {
                    horario: {
                        lte: oneMinuteLater, // Due now or in the past
                    },
                    enviado: false
                },
                include: {
                    task: true,
                    user: true
                }
            });

            for (const reminder of reminders) {
                if (reminder.user.telefone_whatsapp) {
                    const message = `⏰ *Lembrete:*\n\n📝 ${reminder.task.titulo}\n📅 ${reminder.task.prazo ? reminder.task.prazo.toLocaleString('pt-BR') : ''}`;
                    const to = reminder.user.telefone_whatsapp.includes('@') ? reminder.user.telefone_whatsapp : `${reminder.user.telefone_whatsapp}@c.us`;

                    await this.whatsappService.sendMessage(to, message);

                    await prisma.reminder.update({
                        where: { id: reminder.id },
                        data: { enviado: true }
                    });
                    console.log(`✅ Specific Reminder sent to ${reminder.user.nome}`);
                }
            }

            // 2. Fallback: Standard 1-hour warning for HIGH priority tasks (if no specific reminder exists?)
            // For now, sticking to the requested feature: specific reminders + daily summary. 
            // The old logic was removed as requested to prioritize "options". 
            // We can re-add if needed, but the user wants "configurar uma opcao". 
            // Let's assume the new "Smart Bot" handles the creation of reminders.

        } catch (error) {
            console.error('❌ Error checking reminders:', error);
        }
    }

    private async checkDailySummaries() {
        try {
            // Find users with daily summary configured
            const users = await prisma.user.findMany({
                where: { dailySummaryTime: { not: null } }
            });

            const now = new Date(); // Server time (UTC usually in docker, or system time)

            for (const user of users) {
                if (!user.dailySummaryTime) continue;

                // Determine current time in user's timezone
                const userTimeStr = now.toLocaleTimeString('pt-BR', {
                    timeZone: user.timezone,
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Compare HH:mm
                if (userTimeStr === user.dailySummaryTime) {
                    await this.sendDailySummary(user);
                }
            }
        } catch (error) {
            console.error('❌ Error checking summaries:', error);
        }
    }

    private async sendDailySummary(user: any) {
        // Calculate "Tomorrow" in user's timezone
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Define day boundaries for tomorrow
        const startOfDay = new Date(tomorrow.toLocaleDateString('en-US', { timeZone: user.timezone }));
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch tasks
        const tasks = await prisma.task.findMany({
            where: {
                responsavel_id: user.id,
                prazo: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { not: 'CONCLUIDA' }
            }
        });

        // Skip if empty? Or send "Nothing for tomorrow"?
        if (tasks.length === 0) return;

        let msg = `🌅 *Resumo para Amanhã* (${tomorrow.toLocaleDateString('pt-BR')}):\n\n`;
        tasks.forEach(t => {
            const time = t.prazo ? t.prazo.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: user.timezone }) : '---';
            msg += `▫️ ${t.titulo} (${time})\n`;
        });
        msg += `\nPrepare-se! 💪`;

        const to = user.telefone_whatsapp.includes('@') ? user.telefone_whatsapp : `${user.telefone_whatsapp}@c.us`;
        await this.whatsappService.sendMessage(to, msg);
        console.log(`✅ Daily summary sent to ${user.nome}`);
    }
}
