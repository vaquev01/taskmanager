import { Client, LocalAuth, Message, Buttons } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { TaskService } from './task.service';
import { prisma } from '../lib/prisma';
import { TaskPriority, TaskStatus } from '@prisma/client';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const WEB_VERSION_CACHE = {
    type: 'remote' as const,
    remotePath: 'https://raw.githubusercontent.com/nicaudinet/nicaudinet.github.io/refs/heads/main/client-info.json',
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class WhatsappService {
    private client: Client;
    private taskService: TaskService;
    public qrCode: string | null = null;
    public isReady: boolean = false;
    private ffmpegPath: string;

    constructor() {
        this.taskService = new TaskService();
        this.ffmpegPath = path.join(__dirname, '..', 'bin', 'ffmpeg');

        this.client = new Client({
            authStrategy: new LocalAuth(),
            webVersionCache: WEB_VERSION_CACHE,
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
            }
        });

        this.initializeEvents();
    }

    public async reload() {
        console.log('🔄 Restarting WhatsApp Client...');
        try {
            await this.client.destroy();
        } catch (e) {
            console.error('Error destroying client:', e);
        }

        this.client = new Client({
            authStrategy: new LocalAuth(),
            webVersionCache: WEB_VERSION_CACHE,
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
            }
        });
        this.initializeEvents();
        this.client.initialize();
        this.isReady = false;
        this.qrCode = null;
    }

    private initializeEvents() {
        this.client.on('qr', (qr) => {
            console.log('📱 Scan this QR Code to log in to WhatsApp:');
            this.qrCode = qr;
            this.isReady = false;
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp Client is Ready!');
            this.isReady = true;
            this.qrCode = null;
        });

        this.client.on('authenticated', () => {
            this.isReady = true;
            this.qrCode = null;
        });

        this.client.on('disconnected', () => {
            console.log('❌ WhatsApp Client Disconnected');
            this.isReady = false;
        });

        this.client.on('auth_failure', () => {
            console.log('❌ WhatsApp Auth Failed — clearing session...');
            this.isReady = false;
            this.qrCode = null;
            const authPath = path.join(__dirname, '..', '.wwebjs_auth');
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
            }
        });

        this.client.on('message', async (msg) => {
            await this.handleIncomingMessage(msg);
        });
    }

    public async initialize() {
        console.log('🔄 Initializing WhatsApp Client...');
        try {
            await this.client.initialize();
        } catch (error) {
            console.error('❌ WhatsApp initialization failed:', (error as Error).message);
            console.log('🔄 Clearing corrupted session and retrying in 10s...');
            // Clear corrupted auth
            const authPath = path.join(__dirname, '..', '.wwebjs_auth');
            if (fs.existsSync(authPath)) {
                fs.rmSync(authPath, { recursive: true, force: true });
                console.log('🗑️ Cleared corrupted auth session');
            }
            // Retry after delay
            setTimeout(() => {
                this.client = new Client({
                    authStrategy: new LocalAuth(),
                    webVersionCache: WEB_VERSION_CACHE,
                    puppeteer: {
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
                    }
                });
                this.initializeEvents();
                this.client.initialize().catch((e) => {
                    console.error('❌ WhatsApp retry failed:', (e as Error).message);
                });
            }, 10000);
        }
    }

    public async sendMessage(to: string, message: string) {
        if (!this.isReady) return;
        try {
            await this.client.sendMessage(to, message);
        } catch (error) {
            console.error('❌ Error sending WhatsApp message:', error);
        }
    }

    private async handleIncomingMessage(msg: Message) {
        const contact = await msg.getContact();
        const phoneNumber = contact.number;
        let text = msg.body.trim();

        console.log(`📩 Message from ${phoneNumber}`);

        // 1. Identify User
        let user = await prisma.user.findUnique({
            where: { telefone_whatsapp: phoneNumber }
        });

        if (!user) {
            // Auto-register logic (Simplified for Smart Bot)
            if (text.toLowerCase().includes('start') || text.toLowerCase().includes('oi')) {
                const name = contact.pushname || 'Novo Usuário';
                user = await prisma.user.create({
                    data: { nome: name, telefone_whatsapp: phoneNumber }
                });
                await msg.reply(`👋 Olá ${name}! Eu sou seu Assistente de Tarefas.\n\nPode me mandar áudios ou textos dizendo o que precisa fazer. Lembre-se de sempre dizer *quando* é para fazer!`);
            } else {
                await msg.reply('👋 Olá! Mande um "Oi" para começarmos.');
                return;
            }
        }

        // 2. Transcribe Audio if present
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media.mimetype.includes('audio') || media.mimetype.includes('ogg')) {
                console.log('🎙️ Processing Voice Note...');
                try {
                    text = await this.transcribeAudio(media);
                    await msg.reply(`📝 *Transcrição:* "${text}"`);
                } catch (e) {
                    console.error('Transcription failed:', e);
                    await msg.reply('❌ Não consegui entender o áudio. Pode escrever?');
                    return;
                }
            }
        }

        if (!text) return;

        // 3. Smart Processing (Text or Transcribed Audio)
        await this.processSmartMessage(msg, user, text);
    }

    private async transcribeAudio(media: any): Promise<string> {
        // Save base64 to temp file
        const tempId = Date.now();
        const inputPath = path.join(__dirname, '..', `temp_${tempId}.ogg`);
        const outputPath = path.join(__dirname, '..', `temp_${tempId}.mp3`);

        fs.writeFileSync(inputPath, media.data, 'base64');

        try {
            // Convert to MP3 using local ffmpeg
            await execPromise(`${this.ffmpegPath} -i ${inputPath} ${outputPath}`);

            // Send to Whisper
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(outputPath),
                model: 'whisper-1',
                language: 'pt',
            });

            return transcription.text;
        } finally {
            // Cleanup
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    }

    private conversationHistory: Map<string, Array<{ role: 'user' | 'assistant' | 'system', content: string }>> = new Map();

    private updateHistory(userId: string, role: 'user' | 'assistant', content: string) {
        if (!this.conversationHistory.has(userId)) {
            this.conversationHistory.set(userId, []);
        }
        const history = this.conversationHistory.get(userId)!;
        history.push({ role, content });
        // Keep last 10 messages
        if (history.length > 10) history.shift();
    }

    private async processSmartMessage(msg: Message, user: any, text: string) {
        // Special Commands (Fallback/Menus)
        const lower = text.toLowerCase();

        // Update History with User Message
        this.updateHistory(user.id, 'user', text);

        if (lower === 'ajuda' || lower === 'menu') {
            const menu = `🤖 *Menu Inteligente*\n\n` +
                `📅 *Tarefas de Hoje* (Digite "hoje")\n` +
                `📋 *Minhas Tarefas* (Digite "lista")\n` +
                `👥 *Equipe* (Digite "equipe")\n\n` +
                `💡 Para criar, apenas diga: *"Reunião amanhã às 10h"* ou mande um áudio!`;
            await msg.reply(menu);
            this.updateHistory(user.id, 'assistant', menu);
            return;
        }

        // Team Management
        if (lower === 'equipe' || lower === 'time') {
            await this.listTeam(msg);
            return;
        }
        if (lower.startsWith('add membro') || lower.startsWith('novo membro')) {
            await this.addMember(msg, text);
            return;
        }
        if (lower.startsWith('rm membro') || lower.startsWith('remover membro')) {
            await this.removeMember(msg, text);
            return;
        }

        if (lower === 'hoje') {
            const tasks = await this.taskService.getTasksForToday(user.id);
            if (tasks.length === 0) return msg.reply('✨ Tudo limpo por hoje!');
            return msg.reply('📅 *Hoje:*\n' + tasks.map(t => `▫️ ${t.titulo}`).join('\n'));
        }

        if (lower === 'lista' || lower === 'minhas tarefas') {
            const tasks = await this.taskService.listUserTasks(user.id);
            if (tasks.length === 0) return msg.reply('✅ Nenhuma tarefa pendente.');
            return msg.reply('📋 *Pendentes:*\n' + tasks.map(t => `▫️ ${t.titulo} (${t.prazo ? new Date(t.prazo).toLocaleDateString() : 'Sem data'})`).join('\n'));
        }

        // AI Intent Analysis
        try {
            const history = this.conversationHistory.get(user.id) || [];

            const systemPrompt = `Você é um assistente pessoal de produtividade (SmartBot).
                        
                        CONTEXTO TEMPORAL:
                        - Data/Hora Atual (Local): ${new Date().toLocaleString('pt-BR', { timeZone: user.timezone })}
                        - Fuso Horário do Usuário: ${user.timezone}
                        - Dia da semana atual: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', timeZone: user.timezone })}

                        SUA MISSÃO:
                        Analise o HISTÓRICO DE CONVERSA e a última mensagem para decidir se deve criar uma NOVA TAREFA, COMPLETAR UMA TAREFA PENDENTE ou APENAS CONVERSAR.
                        
                        REGRAS DE INTERPRETAÇÃO:
                        1. **Contexto**: Use o histórico! Se o bot perguntou "Quando?", e o usuário respondeu "Amanhã", junte com a mensagem anterior ("Fazer relatório") para criar a tarefa.
                        2. Se for apenas saudação ("Oi", "Olá", "Bom dia") ou agradecimento, retorne "is_task": false e uma "reply_message" amigável.
                        3. Se for uma intenção de tarefa, extraia os dados.
                        4. DATAS: Retorne a data SEMPRE no formato ISO com o Offset do fuso horário (ex: "2023-10-25T18:00:00-03:00"). NÃO use UTC (Z).
                            - "Amanhã" = Data de hoje + 1 dia, mantendo o fuso.
                            - "18h" = 18:00 no fuso ${user.timezone}.
                        5. Lembretes: "Me lembre 10 min antes" -> reminder_offset_minutes: 10.

                        SAÍDA JSON OBRIGATÓRIA:
                        { 
                            "is_task": boolean,
                            "reply_message": string | null, (Use apenas se is_task=false OU se faltar dados como a data, para perguntar ao usuário)
                            "title": string | null, 
                            "priority": "ALTA"|"MEDIA"|"BAIXA", 
                            "date": string (ISO8601 com Offset) or null, 
                            "date_missing": boolean, 
                            "category": "TRABALHO"|"PESSOAL"|"ESTUDO"|"SAUDE",
                            "is_recurring": boolean,
                            "recurrence": "daily"|"weekly"|"monthly"|null,
                            "reminder_offset_minutes": number | null
                        }
                        
                        IMPORTANTE:
                        - Se a tarefa estiver incompleta (ex: falta data), retorne "is_task": false e pergunte a data em "reply_message".
                        - Se o histórico mostrar que o usuário acabou de fornecer a data que faltava, retorne "is_task": true com todos os dados unidos.
                        `;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }))
                ],
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(completion.choices[0].message.content || '{}');

            // 1. Not a task (Greeting/Chat/Clarification)
            if (!result.is_task) {
                if (result.reply_message) {
                    await msg.reply(result.reply_message);
                    this.updateHistory(user.id, 'assistant', result.reply_message);
                } else {
                    const fallback = '👋 Olá! Estou pronto para ajudar. Diga algo como "Reunião amanhã às 10h".';
                    await msg.reply(fallback);
                    this.updateHistory(user.id, 'assistant', fallback);
                }
                return;
            }

            // 2. Task but missing date (Should be handled by is_task=false + reply_message in prompt, but safety check)
            if (result.date_missing) {
                const question = '📅 *Faltou a data!* Quando devo agendar isso?';
                await msg.reply(question);
                this.updateHistory(user.id, 'assistant', question);
                return;
            }

            // 3. Create Task
            const newTask = await this.taskService.createTask({
                titulo: result.title || 'Nova Tarefa',
                descricao: `Categoria: ${result.category || 'Geral'}.`,
                criador_id: user.id,
                responsavel_id: user.id,
                prazo: result.date ? new Date(result.date) : undefined, // Date constructor handles ISO with offset correctly
                prioridade: result.priority || TaskPriority.MEDIA,
                isRecurring: result.is_recurring,
                recurrenceInterval: result.recurrence
            });

            // Create Reminder
            let reminderMsg = '';
            if (result.reminder_offset_minutes && newTask.prazo) {
                const reminderTime = new Date(newTask.prazo.getTime() - (result.reminder_offset_minutes * 60000));
                await prisma.reminder.create({
                    data: {
                        task_id: newTask.id,
                        user_id: user.id,
                        horario: reminderTime,
                        enviado: false
                    }
                });
                reminderMsg = `\n⏰ Lembrete: ${result.reminder_offset_minutes}min antes`;
            }

            const dateStr = newTask.prazo ? new Date(newTask.prazo).toLocaleString('pt-BR', { timeZone: user.timezone, dateStyle: 'short', timeStyle: 'short' }) : 'Sem data';
            const successMsg = `✅ *Tarefa Agendada!*\n\n📝 ${newTask.titulo}\n📅 ${dateStr}\n🏷️ ${result.category || 'Geral'}${reminderMsg}`;

            await msg.reply(successMsg);
            this.updateHistory(user.id, 'assistant', successMsg);

        } catch (error) {
            console.error('AI Processing Error:', error);
            await msg.reply('😵 Tive um problema ao processar isso. Tente novamente mais tarde.');
        }
    }

    private async listTeam(msg: Message) {
    const users = await prisma.user.findMany({ orderBy: { nome: 'asc' } });
    const list = users.map((u, i) => `${i + 1}. *${u.nome}*\n   📞 ${u.telefone_whatsapp}`).join('\n\n');

    await msg.reply(`👥 *Equipe (${users.length})*\n\n${list}\n\n👇 *Comandos de Gestão:*\n- "add membro [Nome], [11999999999]"\n- "rm membro [Nome ou Tel]"`);
}

    private async addMember(msg: Message, text: string) {
    const content = text.replace(/^(add|novo) membro\s+/i, '').trim();
    const parts = content.split(',').map(p => p.trim());

    if (parts.length < 2) {
        return msg.reply('❌ Formato inválido.\nUse: *add membro Nome, 5511999999999*');
    }

    const phone = parts.pop()!;
    const name = parts.join(',');
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
        return msg.reply('❌ Telefone inválido. Inclua DDD e código do país (ex: 5511...)');
    }

    try {
        await prisma.user.create({
            data: {
                nome: name,
                telefone_whatsapp: cleanPhone
            }
        });
        await msg.reply(`✅ Membro *${name}* adicionado à equipe!`);
    } catch (e) {
        await msg.reply('❌ Erro: Telefone já cadastrado ou inválido.');
    }
}

    private async removeMember(msg: Message, text: string) {
    const term = text.replace(/^(rm|remover) membro\s+/i, '').trim();

    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { telefone_whatsapp: { contains: term } },
                { nome: { contains: term, mode: 'insensitive' } }
            ]
        }
    });

    if (!user) return msg.reply('❌ Usuário não encontrado.');

    try {
        await prisma.user.delete({ where: { id: user.id } });
        await msg.reply(`🗑️ Membro *${user.nome}* removido.`);
    } catch (e) {
        await msg.reply('❌ Não foi possível remover. O usuário pode ter tarefas vinculadas.');
    }
}
}

