import { Plus, Inbox, Sparkles } from 'lucide-react';

interface EmptyStateProps {
    onCreateTask: () => void;
}

export const EmptyState = ({ onCreateTask }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-[var(--glass-border)] flex items-center justify-center">
                <Inbox size={36} className="text-violet-400/60" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--glass-surface)] border border-[var(--glass-border)] flex items-center justify-center">
                <Sparkles size={12} className="text-cyan-400" />
            </div>
        </div>
        <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Tudo limpo por aqui! ✨</h3>
        <p className="text-[var(--text-muted)] text-sm max-w-sm mb-6">Nenhuma tarefa encontrada. Crie uma nova tarefa ou envie uma mensagem pelo WhatsApp.</p>
        <button
            onClick={onCreateTask}
            className="btn btn-primary px-6 h-11"
        >
            <Plus size={18} />
            <span>Criar Tarefa</span>
        </button>
    </div>
);
