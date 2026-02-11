import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useToastStore } from '../store/useToastStore';
import { X, Calendar, Flag, FolderOpen, UserCircle, Loader2, CheckCircle2, MessageSquare, Trash2, Plus, ChevronDown } from 'lucide-react';

interface TaskDetailModalProps {
    task: any;
    isOpen: boolean;
    onClose: () => void;
}

export const TaskDetailModal = ({ task, isOpen, onClose }: TaskDetailModalProps) => {
    const addToast = useToastStore(s => s.addToast);
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        titulo: '',
        descricao: '',
        prioridade: 'MEDIA',
        prazo: '',
        status: 'PENDENTE',
        project_id: '',
        responsavel_id: '',
        grupo: '',
        subgrupo: '',
        subtasks: [] as { texto: string, concluida: boolean }[],
    });

    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects').then(r => r.data),
        enabled: isOpen,
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data),
        enabled: isOpen,
    });

    useEffect(() => {
        if (task) {
            setForm({
                titulo: task.titulo || '',
                descricao: task.descricao || '',
                prioridade: task.prioridade || 'MEDIA',
                prazo: task.prazo ? new Date(task.prazo).toISOString().slice(0, 16) : '', // Keep standard formatting for datetime-local
                status: task.status || 'PENDENTE',
                project_id: task.project_id || '',
                responsavel_id: task.responsavel_id || '',
                grupo: task.grupo || '',
                subgrupo: task.subgrupo || '',
                subtasks: task.subtasks || [],
            });
        }
    }, [task]);

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.put(`/tasks/${task.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            addToast('Tarefa atualizada com sucesso!', 'success');
            onClose();
        },
        onError: () => addToast('Erro ao atualizar tarefa. Tente novamente.', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/tasks/${task.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            addToast('Tarefa excluída com sucesso.', 'success');
            onClose();
        },
        onError: () => addToast('Erro ao excluir tarefa. Tente novamente.', 'error'),
    });

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    if (!isOpen || !task) return null;

    const handleSave = () => {
        updateMutation.mutate({
            ...form,
            prazo: form.prazo ? new Date(form.prazo).toISOString() : undefined,
            project_id: form.project_id || undefined,
            grupo: form.grupo || undefined,
            subgrupo: form.subgrupo || undefined,
        });
    };

    const priorities = [
        { value: 'BAIXA', label: 'Baixa', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
        { value: 'MEDIA', label: 'Média', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
        { value: 'ALTA', label: 'Alta', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
    ];

    const statuses = [
        { value: 'PENDENTE', label: 'Pendente', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
        { value: 'EM_PROGRESSO', label: 'Em Progresso', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
        { value: 'CONCLUIDA', label: 'Concluída', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c0c0c] border border-[var(--glass-border)] rounded-3xl shadow-2xl shadow-violet-500/10 animate-fade-in-up overflow-hidden flex flex-col">
                {/* Top gradient */}
                <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-500 shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
                    <h2 className="text-lg font-bold font-display text-[var(--text-muted)]">Editar Tarefa</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { if (confirm('Excluir tarefa?')) deleteMutation.mutate(); }}
                            className="p-2 rounded-xl hover:bg-rose-500/10 text-[var(--text-dim)] hover:text-rose-400 transition-all"
                            title="Excluir"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--glass-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5">
                    {/* Title */}
                    <input
                        type="text"
                        value={form.titulo}
                        onChange={e => setForm({ ...form, titulo: e.target.value })}
                        className="w-full bg-transparent text-2xl font-bold font-display text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none"
                    />

                    {/* Description */}
                    <textarea
                        value={form.descricao}
                        onChange={e => setForm({ ...form, descricao: e.target.value })}
                        placeholder="Adicione uma descrição..."
                        rows={3}
                        className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl p-4 text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-violet-500/50 resize-none transition-colors"
                    />

                    {/* Status */}
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> Status
                        </label>
                        <div className="flex gap-2 mt-2">
                            {statuses.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setForm({ ...form, status: s.value })}
                                    className={`
                                        px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                                        ${form.status === s.value ? s.color : 'text-[var(--text-dim)] bg-transparent border-[var(--glass-border)]'}
                                    `}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priority */}
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
                                        ${form.prioridade === p.value ? p.color : 'text-[var(--text-dim)] bg-transparent border-[var(--glass-border)]'}
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
                                className="mt-2 w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 [color-scheme:dark]"
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
                                    className="mt-2 w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="">Eu</option>
                                    {users?.map((u: any) => (
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

                    {/* Subtasks */}
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 block">Subtarefas</label>

                        {/* New Subtask Input */}
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                placeholder="Adicionar subtarefa..."
                                className="flex-1 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.currentTarget.value.trim();
                                        if (val) {
                                            const newSubtasks = [...(form.subtasks || []), { texto: val, concluida: false }];
                                            setForm({ ...form, subtasks: newSubtasks });
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="p-2 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                                onClick={() => {
                                    const input = document.querySelector('input[placeholder="Adicionar subtarefa..."]') as HTMLInputElement;
                                    if (input && input.value.trim()) {
                                        const newSubtasks = [...(form.subtasks || []), { texto: input.value.trim(), concluida: false }];
                                        setForm({ ...form, subtasks: newSubtasks });
                                        input.value = '';
                                    }
                                }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {/* We need to map from state, not props, to allow editing */}
                            {(form.subtasks || []).map((st: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] group">
                                    <button
                                        onClick={() => {
                                            const newSubtasks = [...(form.subtasks || [])];
                                            newSubtasks[idx].concluida = !newSubtasks[idx].concluida;
                                            setForm({ ...form, subtasks: newSubtasks });
                                        }}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${st.concluida ? 'bg-emerald-500 border-emerald-500' : 'border-[var(--glass-border-hover)]'}`}
                                    >
                                        {st.concluida && <CheckCircle2 size={12} className="text-white" />}
                                    </button>
                                    <span className={`flex-1 text-sm ${st.concluida ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text-main)]'}`}>{st.texto}</span>
                                    <button
                                        onClick={() => {
                                            const newSubtasks = [...(form.subtasks || [])].filter((_, i) => i !== idx);
                                            setForm({ ...form, subtasks: newSubtasks });
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-dim)] hover:text-rose-400 transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comments */}
                    {task.comments?.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <MessageSquare size={12} /> Comentários ({task.comments.length})
                            </label>
                            <div className="flex flex-col gap-2">
                                {task.comments.map((c: any) => (
                                    <div key={c.id} className="p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-violet-400">{c.user?.nome || 'Anônimo'}</span>
                                            <span className="text-xs text-[var(--text-dim)]">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)]">{c.texto}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!form.titulo.trim() || updateMutation.isPending}
                        className="btn btn-primary w-full h-12 text-base font-bold mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            'Salvar Alterações'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
