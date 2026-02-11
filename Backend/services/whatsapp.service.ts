import { Client, LocalAuth, Message, Poll } from 'whatsapp-web.js';
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

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp Client Disconnected:', reason);
            this.isReady = false;
            // Auto-reconnect
            console.log('🔄 Attempting to reconnect in 5s...');
            setTimeout(() => {
                this.client.initialize();
            }, 5000);
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

        this.client.on('vote_update', async (vote) => {
            await this.handlePollVote(vote);
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

    private async handlePollVote(vote: any) {
        // vote.selectedOptions is array of { name: 'Option' }
        // vote.voter is user ID (phone@c.us)
        // vote.parentMessage is the poll message
        const selected = vote.selectedOptions[0]?.name;
        if (!selected) return;

        const voterId = vote.voter;
        const contact = await this.client.getContactById(voterId);
        const phoneNumber = contact.number;

        console.log(`🗳️ Vote from ${phoneNumber}: ${selected}`);

        // Get User
        const user = await prisma.user.findUnique({
            where: { telefone_whatsapp: phoneNumber }
        });

        if (!user) return; // Should not happen if they are voting

        // Simulate Message Handling based on Vote
        // We'll create a fake "Message" object or just call the logic directly
        // But logic is inside handleIncomingMessage/processSmartMessage which expects a Message object to reply to.
        // We don't have a 'msg' object to reply to easily (we can reply to vote.parentMessage?)

        // We can create a "Fake" message object that mimics the interface needed
        // Or refactor logic. 
        // Let's refactor logic minimally: create a helper to send text to user.

        const reply = async (text: string) => {
            await this.client.sendMessage(voterId, text);
        };

        const lower = selected.toLowerCase();

        if (lower.includes('hoje')) {
            const tasks = await this.taskService.getTasksForToday(user.id);
            if (tasks.length === 0) return reply('✨ Tudo limpo por hoje!');
            return reply('📅 *Hoje:*\n' + tasks.map((t: any) => `▫️ ${t.titulo}`).join('\n'));
        }

        if (lower.includes('pendentes') || lower.includes('lista')) {
            const tasks = await this.taskService.listUserTasks(user.id);
            if (tasks.length === 0) return reply('✅ Nenhuma tarefa pendente.');
            return reply('📋 *Pendentes:*\n' + tasks.map((t: any) => `▫️ ${t.titulo} (${t.prazo ? new Date(t.prazo).toLocaleDateString() : 'Sem data'})`).join('\n'));
        }

        if (lower.includes('equipe')) {
            const users = await prisma.user.findMany({ orderBy: { nome: 'asc' } });
            const list = users.map((u, i) => `${i + 1}. *${u.nome}*\n   📞 ${u.telefone_whatsapp}`).join('\n\n');
            return reply(`👥 *Equipe (${users.length})*\n\n${list}`);
        }

        if (lower.includes('criar')) {
            return reply('📝 Para criar uma tarefa, apenas escreva ou mande áudio.\nEx: *"Ligar para cliente amanhã às 14h"*');
        }
    }

    private async sendMainMenu(msg: Message) {
        const poll = new Poll('🤖 *Menu TaskFlow*', [
            '📅 Minhas Tarefas de Hoje',
            '📋 Ver Todas Pendentes',
            '📝 + Criar Nova Tarefa',
            '👥 Equipe'
        ], {
            allowMultipleAnswers: false,
            messageSecret: Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
        });

        await msg.reply(poll);
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
            if (text.toLowerCase().includes('start') || text.toLowerCase().includes('oi') || text.toLowerCase().includes('olá')) {
                const name = contact.pushname || 'Novo Usuário';
                user = await prisma.user.create({
                    data: { nome: name, telefone_whatsapp: phoneNumber }
                });
                await msg.reply(`👋 Olá ${name}! Eu sou seu Assistente de Tarefas.`);
                await this.sendMainMenu(msg);
                return;
            } else {
                // Try to force start if they say anything else
                const name = contact.pushname || 'Novo Usuário';
                user = await prisma.user.create({
                    data: { nome: name, telefone_whatsapp: phoneNumber }
                });
                await msg.reply(`👋 Bem-vindo ao TaskFlow!`);
                await this.sendMainMenu(msg);
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

    // Removed in-memory conversationHistory Map

    private async updateHistory(userId: string, role: 'user' | 'assistant', content: string) {
        try {
            await prisma.chatHistory.create({
                data: {
                    user_id: userId,
                    role: role,
                    content: content
                }
            });
        } catch (e) {
            console.error('Failed to save chat history:', e);
        }
    }

    private async processSmartMessage(msg: Message, user: any, text: string) {
        // Special Commands (Fallback/Menus)
        const lower = text.toLowerCase();

        // Update History with User Message
        await this.updateHistory(user.id, 'user', text);

        if (lower === 'ajuda' || lower === 'menu' || lower === 'botões' || lower === 'botoes') {
            await this.sendMainMenu(msg);
            await this.updateHistory(user.id, 'assistant', '[Enviou Menu de Botões]');
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
            // Get History from DB
            const dbHistory = await prisma.chatHistory.findMany({
                where: { user_id: user.id },
                orderBy: { created_at: 'desc' },
                take: 30
            });

            // Reverse to chronological order
            const history = dbHistory.reverse().map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }));

            const systemPrompt = `Você é um assistente pessoal de produtividade (SmartBot).
                        
                        CONTEXTO TEMPORAL:
                        - Data/Hora Atual (Local): ${new Date().toLocaleString('pt-BR', { timeZone: user.timezone })}
                        - Fuso Horário do Usuário: ${user.timezone}
                        - Dia da semana atual: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', timeZone: user.timezone })}

                        SUA MISSÃO:
                        Analise o HISTÓRICO DE CONVERSA e a última mensagem para identificar UMA OU MAIS tarefas.
                        
                        REGRAS DE INTERPRETAÇÃO:
                        1. **Contexto**: Use o histórico!
                        2. **Múltiplas Tarefas**: Se o usuário disser "Fazer X e Y", crie DUAS tarefas separadas.
                        3. **Datas**:
                             - Se a data for explícita para cada ("X amanhã, Y sexta"), use-as.
                             - Se a data for global ("X e Y amanhã"), aplique a ambas.
                             - Retorne datas em ISO com Offset (ex: "2023-10-25T18:00:00-03:00").
                        4. Se for apenas conversa (sem intenção de tarefa), retorne lista vazia em "tasks".

                        SAÍDA JSON OBRIGATÓRIA:
                        { 
                            "tasks": [
                                {
                                    "title": string, 
                                    "priority": "ALTA"|"MEDIA"|"BAIXA", 
                                    "date": string (ISO8601 com Offset) or null, 
                                    "date_missing": boolean, 
                                    "category": "TRABALHO"|"PESSOAL"|"ESTUDO"|"SAUDE",
                                    "is_recurring": boolean,
                                    "recurrence": "daily"|"weekly"|"monthly"|null,
                                    "reminder_offset_minutes": number | null
                                }
                            ],
                            "reply_message": string | null (Use se não houver tarefas ou se precisar perguntar algo)
                        }
                        
                        IMPORTANTE:
                        - Se detectar tarefas, mas faltar data em alguma, marque "date_missing": true nela.
                        `;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...history // History is already formatted correctly
                ],
                response_format: { type: 'json_object' }
            });

            const result = JSON.parse(completion.choices[0].message.content || '{}');
            const tasks = result.tasks || [];

            // 1. Not a task (Greeting/Chat/Clarification)
            if (tasks.length === 0) {
                if (result.reply_message) {
                    await msg.reply(result.reply_message);
                    await this.sendMainMenu(msg);
                    await this.updateHistory(user.id, 'assistant', result.reply_message);
                } else {
                    await this.sendMainMenu(msg);
                    await this.updateHistory(user.id, 'assistant', 'Enviou menu');
                }
                return;
            }

            // 2. Process Each Task
            let responseText = '';
            let hasMissingDate = false;

            for (const t of tasks) {
                if (t.date_missing) {
                    hasMissingDate = true;
                    responseText += `⚠️ *${t.title || 'Tarefa'}*: Faltou a data.\n`;
                    continue;
                }

                const newTask = await this.taskService.createTask({
                    titulo: t.title || 'Nova Tarefa',
                    descricao: `Categoria: ${t.category || 'Geral'}.`,
                    criador_id: user.id,
                    responsavel_id: user.id,
                    prazo: t.date ? new Date(t.date) : undefined,
                    prioridade: t.priority || TaskPriority.MEDIA,
                    isRecurring: t.is_recurring,
                    recurrenceInterval: t.recurrence
                });

                // Create Reminder
                let reminderMsg = '';
                if (t.reminder_offset_minutes && newTask.prazo) {
                    const reminderTime = new Date(newTask.prazo.getTime() - (t.reminder_offset_minutes * 60000));
                    await prisma.reminder.create({
                        data: {
                            task_id: newTask.id,
                            user_id: user.id,
                            horario: reminderTime,
                            enviado: false
                        }
                    });
                    reminderMsg = ` (⏰ ${t.reminder_offset_minutes}min)`;
                }

                const dateStr = newTask.prazo ? new Date(newTask.prazo).toLocaleString('pt-BR', { timeZone: user.timezone, dateStyle: 'short', timeStyle: 'short' }) : 'Sem data';
                responseText += `✅ *${newTask.titulo}*\n📅 ${dateStr}${reminderMsg}\n\n`;
            }

            if (responseText) {
                await msg.reply(responseText.trim());
                await this.updateHistory(user.id, 'assistant', responseText);
            }

            if (hasMissingDate) {
                const ask = '📅 Algumas tarefas ficaram sem data. Quando devo agendá-las?';
                await msg.reply(ask);
                await this.updateHistory(user.id, 'assistant', ask);
            }

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


