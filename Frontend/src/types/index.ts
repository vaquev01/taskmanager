// Shared type definitions for the Task Manager application

export interface Task {
    id: string;
    titulo: string;
    descricao?: string | null;
    prazo: string | null;
    status: 'PENDENTE' | 'EM_PROGRESSO' | 'CONCLUIDA';
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
    project?: { nome: string; cor: string } | null;
    responsavel?: { nome: string } | null;
    criador?: { nome: string } | null;
    responsavel_id?: string;
    criador_id?: string;
    project_id?: string;
    isRecurring?: boolean;
    recurrenceInterval?: string;
    grupo?: string | null;
    subgrupo?: string | null;
    created_at: string;
    updated_at?: string;
    subtasks?: Subtask[];
    comments?: Comment[];
}

export interface Subtask {
    id: string;
    texto: string;
    concluida: boolean;
}

export interface Comment {
    id: string;
    texto: string;
    autor: { nome: string };
    created_at: string;
}

export interface Project {
    id: string;
    nome: string;
    cor: string;
}

export interface User {
    id: string;
    nome: string;
    telefone_whatsapp: string;
    whatsapp?: string; // Legacy support if needed
    email?: string;
    avatar?: string;
    timezone?: string;
    dailySummaryTime?: string;
}

export type FilterType = 'ALL' | 'PERSONAL' | 'SHARED' | 'ROUTINES';
export type ViewMode = 'LIST' | 'GROUPED' | 'KANBAN';
export type SortBy = 'RECENT' | 'DEADLINE' | 'PRIORITY';
export type TaskStatus = 'PENDENTE' | 'EM_PROGRESSO' | 'CONCLUIDA';
export type TaskPriority = 'BAIXA' | 'MEDIA' | 'ALTA';
