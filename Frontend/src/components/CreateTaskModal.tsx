import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { X, Calendar, Flag, FolderOpen, UserCircle, Loader2, ChevronDown } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateTaskModal = ({ isOpen, onClose }: CreateTaskModalProps) => {
    const { user } = useStore();
    const addToast = useToastStore(s => s.addToast);
    const queryClient = useQueryClient();
    const titleRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        titulo: '',
        descricao: '',
        prioridade: 'MEDIA',
        prazo: '',
        project_id: '',
        responsavel_id: '',
        grupo: '',
        subgrupo: '',
    });

    const { data: _projects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects').then(r => r.data),
        enabled: isOpen,
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data),
        enabled: isOpen,
    });

    const mutation = useMutation({
        mutationFn: (data: any) => api.post('/tasks', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            addToast('Tarefa criada com sucesso!', 'success');
            onClose();
            setForm({ titulo: '', descricao: '', prioridade: 'MEDIA', prazo: '', project_id: '', responsavel_id: '', grupo: '', subgrupo: '' });
        },
        onError: () => addToast('Erro ao criar tarefa. Tente novamente.', 'error'),
    });

    useEffect(() => {
        if (isOpen) setTimeout(() => titleRef.current?.focus(), 100);
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.titulo.trim()) return;
        mutation.mutate({
            ...form,
            criador_id: user?.id,
            responsavel_id: form.responsavel_id || user?.id,
            project_id: form.project_id || undefined,
            prazo: form.prazo ? new Date(form.prazo).toISOString() : undefined,
            grupo: form.grupo || undefined,
            subgrupo: form.subgrupo || undefined,
        });
    };

    const priorities = [
        { value: 'BAIXA', label: 'Baixa', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
        { value: 'MEDIA', label: 'Média', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
        { value: 'ALTA', label: 'Alta', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[#0c0c0c] border border-[var(--glass-border)] rounded-3xl shadow-2xl shadow-violet-500/10 animate-fade-in-up overflow-hidden max-h-[90vh] flex flex-col">
                {/* Top gradient line */}
                <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-500 shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
                    <h2 className="text-xl font-bold font-display">Nova Tarefa</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--glass-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Form - Scrollable */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5 overflow-y-auto">
                    {/* Title */}
                    <div>
                        <input
                            ref={titleRef}
                            type="text"
                            value={form.titulo}
                            onChange={e => setForm({ ...form, titulo: e.target.value })}
                            placeholder="Título da tarefa..."
                            className="w-full bg-transparent text-2xl font-bold font-display text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <textarea
                            value={form.descricao}
                            onChange={e => setForm({ ...form, descricao: e.target.value })}
                            placeholder="Adicione uma descrição..."
                            rows={3}
                            className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl p-4 text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
                        />
                    </div>

                    {/* Priority Pills */}
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Flag size={12} /> Prioridade
                        </label>
                        <div className="flex gap-2 mt-2">
                            {priorities.map(p => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, prioridade: p.value })}
                                    className={`
                                        px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                                        ${form.prioridade === p.value ? p.color : 'text-[var(--text-dim)] bg-transparent border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'}
                                    `}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date + Project + Assignee */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Calendar size={12} /> Prazo
                            </label>
                            <input
                                type="datetime-local"
                                value={form.prazo}
                                onChange={e => setForm({ ...form, prazo: e.target.value })}
                                className="mt-2 w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 transition-colors [color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <UserCircle size={12} /> Responsável
                            </label>
                            <div className="relative">
                                <select
                                    value={form.responsavel_id}
                                    onChange={e => setForm({ ...form, responsavel_id: e.target.value })}
                                    className="mt-2 w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 transition-colors appearance-none cursor-pointer"
                                >
                                    <option value="">Eu</option>
                                    {users?.filter((u: any) => u.id !== user?.id).map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.nome}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Group & Subgroup */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FolderOpen size={12} /> Grupo / Projeto
                            </label>
                            {/* Project Select (acting as Group usually, or explicit Group field) */}
                            {/* User asked for separate Group. Let's provide an Input for Group and keep Project as well if needed, or replace/augment. 
                                 The user mentioned 'Grupo - Agencia Bravvo'. This sounds like 'Project'. 
                                 Let's keep Project Select but also add explicit 'Grupo' text input if they want to override or categorize differently?
                                 Actually, simplest is: Project Select IS the 'Project', and we add 'Grupo' and 'Subgrupo' text inputs.
                             */}
                            <input
                                type="text"
                                value={form.grupo}
                                onChange={e => setForm({ ...form, grupo: e.target.value })}
                                placeholder="Ex: Agencia Bravvo"
                                className="mt-2 w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FolderOpen size={12} /> Subgrupo / Tag
                            </label>
                            <input
                                type="text"
                                value={form.subgrupo}
                                onChange={e => setForm({ ...form, subgrupo: e.target.value })}
                                placeholder="Ex: Mkt, Liderança"
                                className="mt-2 w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!form.titulo.trim() || mutation.isPending}
                        className="btn btn-primary w-full h-12 text-base font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutation.isPending ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            'Criar Tarefa'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
