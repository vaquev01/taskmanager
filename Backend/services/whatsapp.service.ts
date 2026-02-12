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

    constructor() {
        this.taskService = new TaskService();
        this.ffmpegPath = path.join(__dirname, '..', 'bin', 'ffmpeg');
        // Client initialization moved to initialize() method
    }

    private getOpenAI() {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️ OPENAI_API_KEY is missing. AI features will fail.');
            return null;
        }
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
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
            // @ts-ignore
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
            this.client = new Client({
                authStrategy: new LocalAuth(),
                webVersionCache: WEB_VERSION_CACHE,
                puppeteer: {
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
                    executablePath: process.env.CHROME_BIN || (process.platform === 'linux' ? 'chromium' : undefined)
                }
            });

            this.initializeEvents();
            await this.client.initialize();
        } catch (error) {
            console.error('❌ WhatsApp initialization failed:', (error as Error).message);
            // Don't crash the server, just log
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

        if (!user) {
            // ... user registration logic ...
            // (Copy existing logic here or keep it if I use Replace on specific lines)
            // I will assume existing logic for user creation is unchanged if I target correctly.
            // But wait, the Replace tool replaces the WHOLE BLOCK from StartLine to EndLine.
            // I need to be careful not to delete user registration logic if it's inside the range.
            // My StartLine is 229 (handleIncomingMessage start).
        }

        // RE-IMPLEMENTING USER CHECK TO BE SAFE (Simplifying for brevity in this replace block)
        if (!user) {
            if (text.toLowerCase().includes('start') || text.toLowerCase().includes('oi') || text.toLowerCase().includes('olá')) {
                const name = contact.pushname || 'Novo Usuário';
                user = await prisma.user.create({ data: { nome: name, telefone_whatsapp: phoneNumber } });
                await msg.reply(`👋 Olá ${name}!`);
                await this.sendMainMenu(msg);
                return;
            } else {
                const name = contact.pushname || 'Novo Usuário';
                user = await prisma.user.create({ data: { nome: name, telefone_whatsapp: phoneNumber } });
                await msg.reply(`👋 Bem-vindo!`);
                await this.sendMainMenu(msg);
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
            await execPromise(`${this.ffmpegPath} -i ${inputPath} ${outputPath}`);

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
                await msg.reply(`🎭 *Persona Alterada!* Agora eu sou: *${key}*.\n\n${PERSONAS[key].split('.')[0]}.`);
                return;
            } else {
                const options = Object.keys(PERSONAS).filter(k => k !== 'DEFAULT').join(', ');
                await msg.reply(`🎭 Persona não encontrada. Tente:\n${options}`);
                return;
            }
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

            const systemPrompt = `${personaPrompt}
                        
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
                            "reply_message": string | null (Use se não houver tarefas ou se precisar perguntar algo. MANTENHA A PERSONALIDADE DO PERSONAGEM AQUI.)
                        }
                        
                        IMPORTANTE:
                        - Se detectar tarefas, mas faltar data em alguma, marque "date_missing": true nela.
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


