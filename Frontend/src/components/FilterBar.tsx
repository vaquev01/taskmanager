import { ArrowDownUp } from 'lucide-react';
import type { FilterType, SortBy } from '../types';

interface FilterBarProps {
    filter: FilterType;
    setFilter: (f: FilterType) => void;
    grupoFilter: string;
    setGrupoFilter: (g: string) => void;
    uniqueGrupos: string[];
    sortBy: SortBy;
    setSortBy: (s: SortBy) => void;
}

export const FilterBar = ({
    filter,
    setFilter,
    grupoFilter,
    setGrupoFilter,
    uniqueGrupos,
    sortBy,
    setSortBy,
}: FilterBarProps) => (
    <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Status Pills */}
        <div className="flex items-center gap-1 p-1.5 bg-[var(--glass-surface)] w-fit rounded-2xl border border-[var(--glass-border)]">
            {(['ALL', 'PERSONAL', 'SHARED', 'ROUTINES'] as const).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 relative ${filter === f
                        ? 'text-[var(--text-main)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                >
                    {filter === f && (
                        <span className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-xl border border-[var(--glass-border-hover)]" />
                    )}
                    <span className="relative z-10">
                        {f === 'ALL' ? 'Tudo' : f === 'PERSONAL' ? 'Pessoal' : f === 'SHARED' ? 'Compartilhado' : 'Rotinas'}
                    </span>
                </button>
            ))}
        </div>

        {/* Grupo Filter */}
        {uniqueGrupos.length > 0 && (
            <select
                value={grupoFilter}
                onChange={(e) => setGrupoFilter(e.target.value)}
                className="h-11 px-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-sm font-semibold text-[var(--text-main)] appearance-none cursor-pointer hover:border-violet-500/40 transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
                <option value="ALL">Todos os Grupos</option>
                {uniqueGrupos.map((g) => (
                    <option key={g} value={g}>{g}</option>
                ))}
            </select>
        )}

        {/* Sort */}
        <div className="flex items-center gap-1.5 ml-auto">
            <ArrowDownUp size={14} className="text-[var(--text-muted)]" />
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="h-11 px-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-sm font-semibold text-[var(--text-main)] appearance-none cursor-pointer hover:border-violet-500/40 transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
                <option value="RECENT">Mais Recentes</option>
                <option value="DEADLINE">Prazo Mais Próximo</option>
                <option value="PRIORITY">Prioridade Alta</option>
            </select>
        </div>
    </div>
);
