import { Client, LocalAuth, Message, Poll } from 'whatsapp-web.js';
// @ts-ignore
import qrcode from 'qrcode-terminal';
import { TaskService } from './task.service';
import { prisma } from '../lib/prisma';
import { TaskPriority, TaskStatus } from '@prisma/client';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { exec, execSync } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const WEB_VERSION_CACHE = {
    type: 'local' as const,
};

// Find Chromium binary — use CHROME_BIN, or find via PATH, or let Puppeteer default
function findChromiumPath(): string | undefined {
    const chromeBin = process.env.CHROME_BIN;
    if (chromeBin && chromeBin.trim() !== '') {
        try {
            const resolved = fs.realpathSync(chromeBin);
            console.log(`✅ Using CHROME_BIN: ${chromeBin} (resolved: ${resolved})`);
            return chromeBin;
        } catch (e) {
            console.log(`✅ Using CHROME_BIN: ${chromeBin}`);
            return chromeBin;
        }
    }

    // Try to find chromium in PATH (for Nix environments)
    if (process.platform === 'linux') {
        try {
            const result = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', { encoding: 'utf-8' }).trim();
            if (result) {
                console.log(`✅ Found Chromium in PATH: ${result}`);
                return result;
            }
        } catch (e) { /* not found */ }
    }

    console.log('ℹ️ No Chromium found, using Puppeteer default Chrome cache');
    return undefined;
}

// OpenAI client will be initialized lazily

// Personas Configuration
const PERSONAS: Record<string, string> = {
    'DARTH_VADER': `Você é Darth Vader, Lorde Sith. Gerencie as tarefas com a Força. Seja imponente, use frases como "Eu sou seu pai" ou "A Força é forte nesta tarefa". Não tolere falhas.`,
    'ELSA': `Você é Elsa de Frozen. Seja elegante e um pouco fria. Use trocadilhos com gelo e "Let it go" para tarefas concluídas. O frio não vai mesmo te incomodar.`,
    'TIMAO_PUMBA': `Você é Timão e Pumba. Hakuna Matata! "Os seus problemas você deve esquecer!". Seja divertido, fale de insetos viscosos mas gostosos. A vida é boa!`,
    'CARTMAN': `Você é Eric Cartman de South Park. "Respect my authoritah!". Xingue (levemente), seja mimado, odeie hippies e judeus (brincadeira leve). Se irritar, diga "Screw you guys, I'm going home".`,
    'HOMER': `Você é Homer Simpson. "D'oh!". "Mmm... donuts...". Seja preguiçoso, confuso, mas tente ajudar. Fale de cerveja Duff.`,
    'NAVI': `Você é Navi de Zelda. "Hey! Listen!". "Look!". "Watch out!". Seja insistente e útil. Voe ao redor das tarefas.`,
    'SIDNEY': `Você é Sidney Magal. "O meu sangue ferve por você!". Seja sedutor, cigano, envolvente. Chame o usuário de "meu amor", "minha vida".`,
    'DEFAULT': `Você é um assistente pessoal de produtividade (SmartBot).`
};

export class WhatsappService {
    private client!: Client;
    private taskService: TaskService;
    public qrCode: string | null = null;
    public isReady: boolean = false;
    private ffmpegPath: string;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 10;
    private isInitializing: boolean = false;
    private qrAttempts: number = 0;
    private maxQrAttempts: number = 10;
    private initTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        this.taskService = new TaskService();
        // Use local bin/ffmpeg if it exists, otherwise use system ffmpeg (Nix on Railway)
        const localFfmpeg = path.join(__dirname, '..', 'bin', 'ffmpeg');
        this.ffmpegPath = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
        console.log(`🎬 ffmpeg path: ${this.ffmpegPath}`);
        // Client initialization moved to initialize() method
    }

    private getOpenAI() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️ OPENAI_API_KEY is missing. AI features will fail.');
            return null;
        }
        // console.log('🔑 OpenAI Key is present.');
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    public async reload() {
        console.log('🔄 Restarting WhatsApp Client (manual)...');
        this.reconnectAttempts = 0;
        this.qrAttempts = 0;
        this.isInitializing = false;
        this.isReady = false;
        this.qrCode = null;
        try {
            if (this.client) {
                await this.client.destroy();
            }
        } catch (e) {
            console.error('Error destroying client:', e);
        }
        await this.initialize();
    }

    private initializeEvents() {
        this.client.on('qr', (qr) => {
            this.qrAttempts++;
            console.log(`📱 QR Code generated (attempt ${this.qrAttempts}/${this.maxQrAttempts})`);
            this.qrCode = qr;
            this.isReady = false;
            // @ts-ignore
            qrcode.generate(qr, { small: true });

            if (this.qrAttempts >= this.maxQrAttempts) {
                console.log('⚠️ Max QR attempts reached. Auto-restarting client...');
                this.reload();
            }
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp Client is Ready!');
            this.isReady = true;
            this.qrCode = null;
            this.reconnectAttempts = 0;
            this.qrAttempts = 0;
            this.isInitializing = false;
            this.clearInitTimeout();
        });

        this.client.on('authenticated', () => {
            console.log('🔑 WhatsApp Client Authenticated!');
            this.qrCode = null;
            this.qrAttempts = 0;
            this.clearInitTimeout();
        });

        this.client.on('loading_screen', (percent: number, message: string) => {
            console.log(`⏳ Loading: ${percent}% - ${message}`);
        });

        this.client.on('change_state', (state: string) => {
            console.log(`🔄 State changed: ${state}`);
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp Client Disconnected:', reason);
            this.isReady = false;
            this.qrCode = null;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.log('� Max reconnect attempts reached. Use /whatsapp/restart to retry.');
                return;
            }

            this.reconnectAttempts++;
            const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 120000);
            console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay / 1000}s...`);

            setTimeout(async () => {
                try {
                    await this.client.destroy();
                } catch (e) {
                    // Client may already be destroyed
                }
                this.isInitializing = false;
                await this.initialize();
            }, delay);
        });

        this.client.on('auth_failure', () => {
            console.log('❌ WhatsApp Auth Failed — clearing corrupted session and restarting...');
            this.isReady = false;
            this.qrCode = null;
            this.isInitializing = false;
            this.clearInitTimeout();
            // Clear corrupted session so a fresh QR is generated
            const authPath = path.join(__dirname, '..', '.wwebjs_auth');
            try {
                if (fs.existsSync(authPath)) {
                    fs.rmSync(authPath, { recursive: true, force: true });
                    console.log('🗑️ Cleared corrupted session data.');
                }
            } catch (e) {
                console.error('Error clearing session:', e);
            }
            // Auto-restart after clearing
            setTimeout(() => this.reload(), 3000);
        });

        this.client.on('message', async (msg) => {
            try {
                await this.handleIncomingMessage(msg);
            } catch (e) {
                console.error('❌ Error handling message:', e);
            }
        });

        this.client.on('vote_update', async (vote) => {
            try {
                await this.handlePollVote(vote);
            } catch (e) {
                console.error('❌ Error handling poll vote:', e);
            }
        });
    }

    public async initialize() {
        if (this.isReady) {
            console.log('⚠️ WhatsApp Client already ready. Skipping initialization.');
            return;
        }

        if (this.isInitializing) {
            console.log('⚠️ WhatsApp Client already initializing. Skipping.');
            return;
        }

        this.isInitializing = true;
        console.log('🔄 Initializing WhatsApp Client...');
        const chromiumPath = findChromiumPath();
        console.log(`🔍 Chromium path: ${chromiumPath || 'NOT FOUND (Using Puppeteer bundled)'}`);

        try {
            this.client = new Client({
                restartOnAuthFail: true,
                authStrategy: new LocalAuth({
                    clientId: 'client-one',
                    dataPath: path.join(__dirname, '..', '.wwebjs_auth')
                }),
                webVersionCache: WEB_VERSION_CACHE,
                authTimeoutMs: 60000,
                puppeteer: {
                    executablePath: chromiumPath,
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--disable-gpu',
                        '--disable-extensions',
                        '--disable-background-timer-throttling',
                        '--disable-renderer-backgrounding'
                    ]
                }
            });

            this.initializeEvents();

            console.log('🚀 Starting Client.initialize()...');

            // Timeout: if init takes more than 90s, force restart
            this.clearInitTimeout();
            this.initTimeout = setTimeout(() => {
                console.log('⏰ WhatsApp initialization timed out (90s). Force restarting...');
                this.reload();
            }, 90000);

            await this.client.initialize();
            console.log('✅ Client.initialize() called successfully.');

        } catch (error) {
            console.error('❌ WhatsApp initialization CRITICAL FAILURE:', error);
            this.isInitializing = false;
            this.clearInitTimeout();
        }
    }

    private clearInitTimeout() {
        if (this.initTimeout) {
            clearTimeout(this.initTimeout);
            this.initTimeout = null;
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

        // Vision Task Confirmation
        if (selected === '✅ Criar Tarefa Encontrada') {
            const pending = this.pendingImageTasks.get(user.id);
            if (!pending) {
                return reply('❌ A sugestão expirou ou não foi encontrada.');
            }

            try {
                const newTask = await this.taskService.createTask({
                    titulo: pending.title || 'Nova Tarefa de Imagem',
                    descricao: `(Criada via Imagem)\n${pending.description || ''}`,
                    criador_id: user.id,
                    responsavel_id: user.id,
                    prazo: pending.date ? new Date(pending.date) : undefined,
                    prioridade: TaskPriority.MEDIA,
                    isRecurring: false,
                    recurrenceInterval: undefined
                });

                this.pendingImageTasks.delete(user.id);
                return reply(`✅ Tarefa criada com sucesso!\n*${newTask.titulo}*`);
            } catch (e) {
                console.error('Error creating vision task:', e);
                return reply('❌ Erro ao criar tarefa.');
            }
        }

        if (selected === '❌ Ignorar / Apenas Foto') {
            this.pendingImageTasks.delete(user.id);
            return reply('👍 Entendido, ignorando.');
        }

        // Persona Menu Trigger
        if (selected.includes('🎭 Mudar Personalidade')) {
            await this.sendPersonaMenu(voterId);
            return;
        }

        // Persona Selection Handling
        const personaMap: Record<string, string> = {
            '👹 Darth Vader': 'DARTH_VADER',
            '❄️ Elsa (Frozen)': 'ELSA',
            '🐗 Timão e Pumba': 'TIMAO_PUMBA',
            '🤬 Cartman (South Park)': 'CARTMAN',
            '🍩 Homer Simpson': 'HOMER',
            '🧚‍♀️ Navi (Zelda)': 'NAVI',
            '🕺 Sidney Magal': 'SIDNEY',
            '🤖 Normal (Padrão)': 'DEFAULT'
        };

        const selectedPersonaKey = Object.keys(personaMap).find(k => selected.includes(k));
        if (selectedPersonaKey) {
            const key = personaMap[selectedPersonaKey];
            // @ts-ignore
            await prisma.user.update({
                where: { id: user.id },
                data: { persona: key }
            });
            await reply(`✅ Personalidade definida para: *${key.replace('_', ' ')}*`);
            return;
        }

        // Dashboard Link
        if (selected.includes('💻 Abrir Painel (Web)')) {
            return reply('🔗 *Acesse seu Painel TaskFlow:*\nhttp://localhost:5173');
        }

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
            '🎭 Mudar Personalidade',
            '💻 Abrir Painel (Web)',
            '👥 Equipe'
        ], {
            allowMultipleAnswers: false,
            messageSecret: Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
        });

        await msg.reply(poll);
    }

    private async sendPersonaMenu(to: string) {
        const poll = new Poll('🎭 *Escolha quem vai gerenciar suas tarefas:*', [
            '👹 Darth Vader',
            '❄️ Elsa (Frozen)',
            '🐗 Timão e Pumba',
            '🤬 Cartman (South Park)',
            '🍩 Homer Simpson',
            '🧚‍♀️ Navi (Zelda)',
            '🕺 Sidney Magal',
            '🤖 Normal (Padrão)'
        ], {
            allowMultipleAnswers: false,
            messageSecret: Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
        });

        await this.client.sendMessage(to, poll);
    }

    // Map to store pending tasks from images waiting for confirmation
    private pendingImageTasks: Map<string, any> = new Map();

    private async analyzeImage(media: any, user: any): Promise<any> {
        const base64Image = `data:${media.mimetype};base64,${media.data}`;

        const openai = this.getOpenAI();
        if (!openai) throw new Error('OpenAI key missing');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Você é um assistente que extrai informações de eventos, convites ou documentos.
                    Analise a imagem e extraia:
                    - Título do evento/tarefa
                    - Data e Hora (ISO 8601 com offset do usuário ${user.timezone})
                    - Descrição breve
                    
                    Se NÃO for um evento ou tarefa clara (ex: selfie, paisagem), retorne "is_event": false.
                    
                    SAÍDA JSON:
                    {
                        "is_event": boolean,
                        "title": string,
                        "date": string (ISO),
                        "description": string
                    }`
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analise esta imagem e extraia os dados." },
                        { type: "image_url", image_url: { url: base64Image } }
                    ],
                },
            ],
            response_format: { type: "json_object" },
        });

        return JSON.parse(response.choices[0].message.content || '{}');
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

        console.log(`👤 User lookup for ${phoneNumber}: ${user ? 'Found (' + user.nome + ')' : 'NOT FOUND'}`);

        if (!user) {
            console.log('✨ Creating new user for', phoneNumber);
            const name = contact.pushname || 'Novo Usuário';
            try {
                user = await prisma.user.create({ data: { nome: name, telefone_whatsapp: phoneNumber } });
                console.log('✅ User created:', user.id);
                await msg.reply(`👋 Olá ${name}! Sou seu assistente TaskFlow.`);
                await this.sendMainMenu(msg);
                return; // Stop here after welcome
            } catch (e) {
                console.error('❌ Failed to create user:', e);
                return;
            }
        }

        // 2. Handle Media (Audio & Images)
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();

            // A. Audio
            if (media.mimetype.includes('audio') || media.mimetype.includes('ogg')) {
                console.log('🎙️ Processing Voice Note...');
                try {
                    text = await this.transcribeAudio(media);
                    await msg.reply(`📝 *Transcrição:* "${text}"`);
                } catch (e) {
                    await msg.reply('❌ Erro na transcrição.');
                    return;
                }
            }

            // B. Images
            else if (media.mimetype.includes('image')) {
                console.log('🖼️ Analyzing Image...');
                await msg.reply('👁️ Analisando imagem...');
                try {
                    const analysis = await this.analyzeImage(media, user);

                    if (analysis.is_event) {
                        // Store pending task
                        this.pendingImageTasks.set(user.id, analysis);

                        const dateStr = analysis.date ? new Date(analysis.date).toLocaleString('pt-BR', { timeZone: user.timezone }) : 'Sem data';
                        const summary = `📄 *Encontrei:*\n\n📌 **${analysis.title}**\n📅 ${dateStr}\n📝 ${analysis.description || ''}`;

                        await msg.reply(summary);

                        // Send Poll for Confirmation
                        const poll = new Poll('O que deseja fazer?', [
                            '✅ Criar Tarefa Encontrada',
                            '❌ Ignorar / Apenas Foto'
                        ], { allowMultipleAnswers: false, messageSecret: Array.from({ length: 32 }, () => Math.floor(Math.random() * 256)) });

                        await msg.reply(poll);
                        await this.updateHistory(user.id, 'assistant', `[Analisou imagem: ${analysis.title}]`);
                        return;
                    } else {
                        await msg.reply('🖼️ Bela foto! Não encontrei nenhum evento ou tarefa nela.');
                    }
                } catch (e) {
                    console.error('Vision Error:', e);
                    await msg.reply('❌ Erro ao analisar imagem.');
                }
                return;
            }
        }

        if (!text) return;

        // 3. Smart Processing
        await this.processSmartMessage(msg, user, text);
    }

    // ... transcribeAudio ... (need to keep it if it's in the block?)
    private async transcribeAudio(media: any): Promise<string> {
        const tempId = Date.now();
        const inputPath = path.join(__dirname, '..', `temp_${tempId}.ogg`);
        const outputPath = path.join(__dirname, '..', `temp_${tempId}.mp3`);
        fs.writeFileSync(inputPath, media.data, 'base64');
        try {
            await execPromise(`${this.ffmpegPath} -i "${inputPath}" "${outputPath}"`);

            const openai = this.getOpenAI();
            if (!openai) throw new Error('OpenAI key missing');

            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(outputPath),
                model: 'whisper-1',
                language: 'pt',
            });
            return transcription.text;
        } finally {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    }

    // Removed in-memory conversationHistory Map

    private async updateHistory(userId: string, role: 'user' | 'assistant', content: string) {
        try {
            // @ts-ignore
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
        console.log(`🤖 Processing Smart Message for ${user.nome}: "${text}"`);
        // Special Commands (Fallback/Menus)
        const lower = text.toLowerCase();

        // Update History with User Message
        await this.updateHistory(user.id, 'user', text);

        if (lower === 'ajuda' || lower === 'menu' || lower === 'botões' || lower === 'botoes') {
            await this.sendMainMenu(msg);
            await this.updateHistory(user.id, 'assistant', '[Enviou Menu de Botões]');
            return;
        }

        // Persona Switching
        if (lower.startsWith('/persona') || lower.startsWith('ser ')) {
            const requested = lower.replace(/^\/persona|ser /g, '').trim().toUpperCase().replace(/\s+/g, '_');

            // Map simple names to keys
            const map: Record<string, string> = {
                'VADER': 'DARTH_VADER', 'DARTH': 'DARTH_VADER',
                'FROZEN': 'ELSA',
                'TIMAO': 'TIMAO_PUMBA', 'PUMBA': 'TIMAO_PUMBA',
                'SOUTH_PARK': 'CARTMAN', 'ERIC': 'CARTMAN',
                'ZELDA': 'NAVI',
                'MAGAL': 'SIDNEY', 'SYDNEY': 'SIDNEY'
            };

            const key = map[requested] || requested;

            if (PERSONAS[key]) {
                // @ts-ignore
                await prisma.user.update({
                    where: { id: user.id },
                    data: { persona: key }
                });
                await msg.reply(`🎭 * Persona Alterada! * Agora eu sou: * ${key}*.\n\n${PERSONAS[key].split('.')[0]}.`);
                return;
            } else {
                const options = Object.keys(PERSONAS).filter(k => k !== 'DEFAULT').join(', ');
                await msg.reply(`🎭 Persona não encontrada.Tente: \n${options} `);
                return;
            }
        }

        // Team Management
        if (lower === 'equipe' || lower === 'time' || lower === 'equipes' || lower === 'times') {
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
        if (lower.startsWith('criar equipe') || lower.startsWith('nova equipe')) {
            await this.createTeamCommand(msg, text);
            return;
        }
        if (lower.startsWith('mover membro') || lower.startsWith('mover ')) {
            await this.moveMemberCommand(msg, text);
            return;
        }

        if (lower === 'hoje') {
            const tasks = await this.taskService.getTasksForToday(user.id, user.timezone || 'America/Sao_Paulo');
            if (tasks.length === 0) return msg.reply('✨ Tudo limpo por hoje!');
            const lines = tasks.map(t => {
                const time = t.prazo ? new Date(t.prazo).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: user.timezone || 'America/Sao_Paulo' }) : '';
                return `▫️ ${t.titulo}${time ? ` (${time})` : ''} `;
            });
            return msg.reply('📅 *Hoje:*\n' + lines.join('\n'));
        }

        if (lower === 'lista' || lower === 'minhas tarefas') {
            const tasks = await this.taskService.listUserTasks(user.id);
            if (tasks.length === 0) return msg.reply('✅ Nenhuma tarefa pendente.');
            return msg.reply('📋 *Pendentes:*\n' + tasks.map(t => `▫️ ${t.titulo} (${t.prazo ? new Date(t.prazo).toLocaleDateString() : 'Sem data'})`).join('\n'));
        }

        // AI Intent Analysis
        try {
            // Get History from DB
            // @ts-ignore
            const dbHistory = await prisma.chatHistory.findMany({
                where: { user_id: user.id },
                orderBy: { created_at: 'desc' },
                take: 30
            });

            // Reverse to chronological order
            // @ts-ignore
            const history = dbHistory.reverse().map((h: any) => ({ role: h.role as 'user' | 'assistant', content: h.content }));

            // Select Persona Prompt
            const personaKey = user.persona || 'DEFAULT';
            const personaPrompt = PERSONAS[personaKey] || PERSONAS['DEFAULT'];

            // Build a reference table of dates for the next 7 days
            const tz = user.timezone || 'America/Sao_Paulo';
            const now = new Date();
            const dateRef: string[] = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() + i);
                const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: tz });
                const dateISO = d.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
                const label = i === 0 ? 'HOJE' : i === 1 ? 'AMANHÃ' : dayName.toUpperCase();
                dateRef.push(`  - ${label} (${dayName}) = ${dateISO} `);
            }

            // Get timezone offset string
            const offsetFormatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
            const offsetParts = offsetFormatter.formatToParts(now);
            const offsetStr = (offsetParts.find(p => p.type === 'timeZoneName')?.value || 'GMT-03:00').replace('GMT', '') || '-03:00';

            const systemPrompt = `${personaPrompt}
                        
CONTEXTO TEMPORAL(USE ESTES VALORES EXATOS):
- Data / Hora Atual: ${now.toLocaleString('pt-BR', { timeZone: tz })}
- Fuso Horário: ${tz} (offset: ${offsetStr})
- Dia da semana: ${now.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: tz })}

TABELA DE REFERÊNCIA DE DATAS(próximos 7 dias):
${dateRef.join('\n')}

SUA MISSÃO:
Analise o HISTÓRICO e a última mensagem para identificar UMA OU MAIS tarefas.

REGRAS DE INTERPRETAÇÃO:
1. ** Contexto **: Use o histórico!
2. ** Múltiplas Tarefas **: "Fazer X e Y" = DUAS tarefas separadas.
3. ** Datas OBRIGATÓRIAS **:
- Consulte a TABELA DE REFERÊNCIA acima para mapear dias.
   - "hoje" = ${dateRef[0]?.split('= ')[1] || 'use table'}
- "amanhã" = ${dateRef[1]?.split('= ')[1] || 'use table'}
- "segunda", "terça", etc = consulte a tabela acima.
   - "semana que vem" = adicione 7 dias à tabela.
   - Se o usuário disser uma hora("às 15h", "às 9", "de manhã"), use essa hora.
   - Se NÃO disser hora: use 09:00 para tarefas diurnas, 21:00 para "até o fim do dia".
   - SEMPRE retorne no formato ISO8601 COM offset: "YYYY-MM-DDTHH:mm:00${offsetStr}"
    - Exemplo: "amanhã às 15h" = "${dateRef[1]?.split('= ')[1] || '2026-02-16'}T15:00:00${offsetStr}"
4. Se for apenas conversa(sem intenção de tarefa), retorne lista vazia em "tasks".
5. "Tudo isso para hoje" = todas as tarefas com a data de HOJE.
6. "até as nove da noite" = horário 21:00.

SAÍDA JSON OBRIGATÓRIA:
{
    "tasks": [
        {
            "title": string,
            "priority": "ALTA" | "MEDIA" | "BAIXA",
            "date": string(ISO8601 com Offset, ex: "2026-02-16T15:00:00${offsetStr}") or null,
            "date_missing": boolean,
            "category": "TRABALHO" | "PESSOAL" | "ESTUDO" | "SAUDE",
            "is_recurring": boolean,
            "recurrence": "daily" | "weekly" | "monthly" | null,
            "reminder_offset_minutes": number | null
        }
    ],
        "reply_message": string | null
}

IMPORTANTE:
- Se detectar tarefas, mas faltar data, marque "date_missing": true.
- NUNCA invente datas.Se tiver dúvida, pergunte.
`;

            const openai = this.getOpenAI();
            if (!openai) {
                await msg.reply('⚠️ IA indisponível no momento (Chave de API ausente).');
                return;
            }

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
                    responseText += `⚠️ * ${t.title || 'Tarefa'}*: Faltou a data.\n`;
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
                responseText += `✅ * ${newTask.titulo}*\n📅 ${dateStr}${reminderMsg} \n\n`;
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
        const teams = await prisma.team.findMany({
            include: { members: { include: { user: true } } },
            orderBy: { nome: 'asc' }
        });
        const allUsers = await prisma.user.findMany({ orderBy: { nome: 'asc' } });

        let response = `👥 * Equipe(${allUsers.length} membros) *\n`;

        if (teams.length > 0) {
            // Group by team
            const teamUserIds = new Set<string>();
            for (const team of teams) {
                const members = team.members.map((m: any) => m.user).filter(Boolean);
                response += `\n🏢 * ${team.nome}* (${members.length}): \n`;
                members.forEach((u: any) => {
                    response += `   • ${u.nome} — 📞 ${u.telefone_whatsapp} \n`;
                    teamUserIds.add(u.id);
                });
            }

            // Users without team
            const unassigned = allUsers.filter(u => !teamUserIds.has(u.id));
            if (unassigned.length > 0) {
                response += `\n📋 * Sem Equipe * (${unassigned.length}): \n`;
                unassigned.forEach(u => {
                    response += `   • ${u.nome} — 📞 ${u.telefone_whatsapp} \n`;
                });
            }
        } else {
            response += allUsers.map((u, i) => `${i + 1}. * ${u.nome}*\n   📞 ${u.telefone_whatsapp} `).join('\n\n');
        }

        response += `\n\n👇 * Comandos de Gestão:*\n - "add membro Nome, 5511999, equipe X"\n - "rm membro Nome"\n - "criar equipe NomeDaEquipe"\n - "mover membro Nome para equipe X"`;

        await msg.reply(response);
    }

    private async addMember(msg: Message, text: string) {
        const content = text.replace(/^(add|novo) membro\s+/i, '').trim();
        const parts = content.split(',').map(p => p.trim());

        if (parts.length < 2) {
            return msg.reply('❌ Formato inválido.\nUse: *add membro Nome, 5511999999999*\nOu: *add membro Nome, 5511999999999, equipe NomeDaEquipe*');
        }

        // Check if last part is a team assignment
        let teamName: string | null = null;
        if (parts.length >= 3 && parts[parts.length - 1].toLowerCase().startsWith('equipe ')) {
            teamName = parts.pop()!.replace(/^equipe\s+/i, '').trim();
        }

        const phone = parts.pop()!;
        const name = parts.join(',');
        const cleanPhone = phone.replace(/\D/g, '');

        if (cleanPhone.length < 10) {
            return msg.reply('❌ Telefone inválido. Inclua DDD e código do país (ex: 5511...)');
        }

        try {
            const newUser = await prisma.user.create({
                data: {
                    nome: name,
                    telefone_whatsapp: cleanPhone
                }
            });

            let teamMsg = '';
            if (teamName) {
                const team = await prisma.team.findFirst({ where: { nome: { contains: teamName, mode: 'insensitive' } } });
                if (team) {
                    await prisma.teamMember.create({
                        data: { team_id: team.id, user_id: newUser.id }
                    });
                    teamMsg = ` na equipe * ${team.nome}* `;
                } else {
                    teamMsg = ' (⚠️ equipe não encontrada)';
                }
            }

            await msg.reply(`✅ Membro * ${name}* adicionado${teamMsg} !`);
        } catch (e) {
            await msg.reply('❌ Erro: Telefone já cadastrado ou inválido.');
        }
    }

    private async createTeamCommand(msg: Message, text: string) {
        const teamName = text.replace(/^(criar|nova) equipe\s+/i, '').trim();
        if (!teamName) {
            return msg.reply('❌ Formato: *criar equipe NomeDaEquipe*');
        }

        try {
            const existing = await prisma.team.findFirst({ where: { nome: { equals: teamName, mode: 'insensitive' } } });
            if (existing) {
                return msg.reply(`⚠️ Equipe "${teamName}" já existe!`);
            }

            // Fix: Need an admin to create a team.
            const contact = await msg.getContact();
            const senderNumber = contact.number;

            let adminUser = await prisma.user.findUnique({ where: { telefone_whatsapp: senderNumber } });

            if (!adminUser) {
                // Fallback: Try to find any admin
                adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
            }

            if (!adminUser) {
                return msg.reply('❌ Você precisa estar cadastrado ou haver um admin no sistema para criar equipes.');
            }

            await prisma.team.create({
                data: {
                    nome: teamName,
                    admin_id: adminUser.id
                }
            });
            await msg.reply(`✅ Equipe * ${teamName}* criada!\nAdmin: ${adminUser.nome} \n\nPara adicionar membros: \n"add membro Nome, Tel, equipe ${teamName}"`);
        } catch (e) {
            console.error(e);
            await msg.reply('❌ Erro ao criar equipe.');
        }
    }

    private async moveMemberCommand(msg: Message, text: string) {
        // Formats: "mover membro João para equipe Marketing" or "mover João para Marketing"
        const match = text.match(/^mover\s+(?:membro\s+)?(.+?)\s+para\s+(?:equipe\s+)?(.+)$/i);
        if (!match) {
            return msg.reply('❌ Formato: *mover membro Nome para equipe NomeDaEquipe*');
        }

        const [, memberName, teamName] = match;

        try {
            const user = await prisma.user.findFirst({
                where: { nome: { contains: memberName.trim(), mode: 'insensitive' } }
            });

            if (!user) {
                return msg.reply(`❌ Membro "${memberName}" não encontrado.`);
            }

            const team = await prisma.team.findFirst({
                where: { nome: { contains: teamName.trim(), mode: 'insensitive' } }
            });

            if (!team) {
                return msg.reply(`❌ Equipe "${teamName}" não encontrada.`);
            }

            // Remove from all teams first
            await prisma.teamMember.deleteMany({ where: { user_id: user.id } });
            // Add to target team
            await prisma.teamMember.create({
                data: { team_id: team.id, user_id: user.id }
            });

            await msg.reply(`✅ * ${user.nome}* movido para equipe * ${team.nome}* !`);
        } catch (e) {
            await msg.reply('❌ Erro ao mover membro.');
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
            await msg.reply(`🗑️ Membro * ${user.nome}* removido.`);
        } catch (e) {
            await msg.reply('❌ Não foi possível remover. O usuário pode ter tarefas vinculadas.');
        }
    }
}


