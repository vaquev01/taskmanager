# TaskFlow — Gerenciador de Tarefas com WhatsApp AI

> 🚀 Aplicação full-stack para gerenciamento de tarefas integrada com WhatsApp AI Bot

## ✨ Features

- **Dashboard Premium** — Glassmorphism UI com dark/light theme
- **Kanban Board** — Drag & drop entre colunas (Pendente → Em Progresso → Concluída)
- **WhatsApp AI Bot** — Cria tarefas por linguagem natural + transcrição de áudio
- **Subtasks & Comentários** — Gerenciamento granular de tarefas
- **Bulk Actions** — Seleção múltipla + ações em lote
- **Busca Global** — Cmd+K para busca instantânea
- **Calendar View** — Visualização mensal de tarefas
- **Team View** — Dashboard de equipe com estatísticas
- **Recurring Tasks** — Tarefas recorrentes com intervalos customizados
- **Lembretes WhatsApp** — Notificações automáticas via WhatsApp

## 🛠 Tech Stack

| Layer | Tecnologia |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | TailwindCSS 4 + Glassmorphism CSS |
| **State** | Zustand (persist) + React Query |
| **DnD** | @dnd-kit/core + sortable |
| **Backend** | Express + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **WhatsApp** | whatsapp-web.js |
| **AI** | OpenAI GPT-4o-mini + Whisper |
| **Audio** | ffmpeg (transcription) |

## 🚀 Setup Rápido

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### 1. Clonar e instalar

```bash
git clone https://github.com/vaquev01/taskmanager.git
cd taskmanager
```

### 2. Database (PostgreSQL via Docker)

```bash
docker compose up -d db   # Inicia PostgreSQL na porta 5432
```

### 3. Backend

```bash
cd Backend
cp .env.example .env  # Edite com suas chaves
npm install
cd ../Database && npx prisma generate && npx prisma db push
cd ../Backend
npm run dev
```

### 4. Frontend

```bash
cd Frontend
npm install
npm run dev
```

### 5. Acessar
Abra http://localhost:5173 no browser.

## ⚙️ Variáveis de Ambiente

Veja `.env.example` no diretório Backend para todas as variáveis necessárias.

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do banco PostgreSQL |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `OPENAI_API_KEY` | Chave da API OpenAI (GPT + Whisper) |
| `CORS_ORIGINS` | Origins permitidas (separadas por vírgula) |
| `PORT` | Porta do servidor (default: 4000) |

## 📁 Estrutura

```
├── Backend/
│   ├── routes/           # Rotas da API (REST)
│   ├── services/         # Lógica de negócio (WhatsApp, Cron, Tasks)
│   ├── middleware/       # Auth JWT, Admin, Validation, Error
│   ├── schemas/          # Zod validation schemas
│   ├── lib/              # Prisma client, sanitize helpers
│   ├── server.ts         # Entry point Express
│   └── .env.example
├── Database/
│   └── schema.prisma     # Schema do banco (PostgreSQL)
├── Frontend/
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/        # Page views
│   │   ├── store/        # Zustand stores (persist)
│   │   ├── types/        # TypeScript interfaces
│   │   ├── lib/          # API client (axios + interceptors)
│   │   └── App.tsx       # Router + ErrorBoundary
│   └── index.html
├── docker-compose.yml    # PostgreSQL + Backend + Frontend
└── README.md
```

## 📝 Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `⌘K` / `Ctrl+K` | Busca global |
| `N` | Nova tarefa |
| `S` | Modo seleção |

## 📄 Licença

MIT
