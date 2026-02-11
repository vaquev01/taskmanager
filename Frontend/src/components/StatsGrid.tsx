import { TrendingUp, CheckCircle2, Sparkles, AlertTriangle, Wifi, RotateCcw } from 'lucide-react';
import type { Task } from '../types';
import type { UseMutationResult } from '@tanstack/react-query';

interface StatsGridProps {
    tasks: Task[] | undefined;
    completedCount: number;
    inProgressCount: number;
    overdueCount: number;
    waStatus: { isReady: boolean } | undefined;
    restartWhatsappMutation: UseMutationResult<unknown, Error, void, unknown>;
}

export const StatsGrid = ({
    tasks,
    completedCount,
    inProgressCount,
    overdueCount,
    waStatus,
    restartWhatsappMutation,
}: StatsGridProps) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <TrendingUp size={18} />
                </div>
            </div>
            <div className="stat-value">{tasks?.length || 0}</div>
            <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Total de Tarefas</div>
        </div>

        <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={18} />
                </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-display">{completedCount}</div>
            <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Concluídas</div>
        </div>

        <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Sparkles size={18} />
                </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-400 font-display">{inProgressCount}</div>
            <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Em Progresso</div>
        </div>

        <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl border ${overdueCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    <AlertTriangle size={18} />
                </div>
            </div>
            <div className={`text-3xl font-extrabold font-display ${overdueCount > 0 ? 'text-rose-400' : 'text-gray-500'}`}>{overdueCount}</div>
            <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Atrasadas</div>
        </div>

        <div className="stat-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Wifi size={18} />
                    </div>
                    <button
                        onClick={() => restartWhatsappMutation.mutate()}
                        disabled={restartWhatsappMutation.isPending}
                        className="p-2 rounded-lg bg-[var(--glass-surface)] hover:bg-[var(--glass-surface-hover)] border border-[var(--glass-border)] transition-all"
                        title="Reiniciar Conexão"
                    >
                        <RotateCcw size={14} className={restartWhatsappMutation.isPending ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${waStatus?.isReady ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                    <span className="text-lg font-bold text-[var(--text-main)]">WhatsApp</span>
                </div>
                <div className="text-[var(--text-muted)] text-sm font-medium mt-1">{waStatus?.isReady ? 'Conectado' : 'Desconectado'}</div>
            </div>
        </div>
    </div>
);
