import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Search, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';

interface SearchBarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTask: (task: any) => void;
}

export const SearchBar = ({ isOpen, onClose, onSelectTask }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: results, isLoading } = useQuery({
        queryKey: ['search', query],
        queryFn: () => api.get(`/tasks/search?q=${encodeURIComponent(query)}`).then(r => r.data),
        enabled: query.length >= 2,
    });

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) onClose();
                else onClose(); // parent toggles
            }
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    const priorityColors: Record<string, string> = {
        ALTA: 'text-rose-400',
        MEDIA: 'text-yellow-400',
        BAIXA: 'text-green-400',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-[#0c0c0c] border border-[var(--glass-border)] rounded-2xl shadow-2xl shadow-violet-500/10 animate-fade-in-up overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--glass-border)]">
                    <Search size={20} className="text-violet-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Buscar tarefas..."
                        className="flex-1 bg-transparent text-[var(--text-main)] text-lg font-medium placeholder:text-[var(--text-dim)] focus:outline-none"
                    />
                    <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-bold text-[var(--text-dim)] bg-[var(--glass-surface)] px-2 py-1 rounded-md border border-[var(--glass-border)]">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {query.length < 2 ? (
                        <div className="px-5 py-8 text-center text-sm text-[var(--text-dim)]">
                            Digite pelo menos 2 caracteres para buscar...
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 size={24} className="animate-spin text-violet-400" />
                        </div>
                    ) : results?.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                            Nenhuma tarefa encontrada para "{query}"
                        </div>
                    ) : (
                        <div className="py-2">
                            {results?.map((task: any) => (
                                <button
                                    key={task.id}
                                    onClick={() => { onSelectTask(task); onClose(); }}
                                    className="w-full px-5 py-3 flex items-center gap-4 hover:bg-[var(--glass-surface)] transition-colors text-left group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-[var(--text-main)] truncate group-hover:text-violet-300 transition-colors">
                                            {task.titulo}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                                            <span className={`font-bold ${priorityColors[task.prioridade] || ''}`}>{task.prioridade}</span>
                                            {task.project && <span>{task.project.nome}</span>}
                                            {task.prazo && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Date(task.prazo).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ArrowUpRight size={16} className="text-[var(--text-dim)] group-hover:text-violet-400 shrink-0 transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
