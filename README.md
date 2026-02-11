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
| **Database** | SQLite + Prisma ORM |
| **WhatsApp** | whatsapp-web.js |
| **AI** | Google Gemini API |
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

### 2. Backend

```bash
cd Backend
cp .env.example .env  # Edite com suas chaves
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev
```

### 4. Acessar
Abra http://localhost:5173 no browser.

## ⚙️ Variáveis de Ambiente

Veja `.env.example` no diretório Backend para todas as variáveis necessárias.

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do banco SQLite |
| `GEMINI_API_KEY` | Chave da API Google Gemini |
| `PORT` | Porta do servidor (default: 4000) |

## 📁 Estrutura

```
├── Backend/
│   ├── src/
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Lógica de negócio
│   │   └── index.ts      # Entry point
│   ├── prisma/
│   │   └── schema.prisma # Schema do banco
│   └── .env.example
├── Frontend/
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/        # Page views
│   │   ├── store/        # Zustand stores
│   │   ├── types/        # TypeScript interfaces
│   │   ├── lib/          # API client
│   │   └── App.tsx       # Router + ErrorBoundary
│   └── index.html
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
