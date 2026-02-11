import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Users, Sparkles, Mail, Phone, BarChart3, Plus, Edit2, List, Network } from 'lucide-react';
import { MemberModal } from '../components/MemberModal';
import { OrganogramBoard } from '../components/OrganogramBoard';
import type { User } from '../types';

export const TeamPage = () => {
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<User | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'organogram'>('list');

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data),
    });

    const { data: tasks } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => api.get('/tasks').then(r => r.data),
    });

    const getTaskStats = (userId: string) => {
        if (!tasks) return { total: 0, done: 0, pending: 0 };
        const userTasks = tasks.filter((t: any) => t.responsavel_id === userId);
        const done = userTasks.filter((t: any) => t.status === 'CONCLUIDA').length;
        return { total: userTasks.length, done, pending: userTasks.length - done };
    };

    const handleEditMember = (user: User) => {
        setEditingMember(user);
        setIsMemberModalOpen(true);
    };

    const handleNewMember = () => {
        setEditingMember(null);
        setIsMemberModalOpen(true);
    };

    return (
        <div className="p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto pb-32">
            <MemberModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                member={editingMember}
            />

            {/* Header */}
            <div className="mb-10 animate-fade-in-up flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Gestão de Equipe</span>
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles size={10} /> PRO
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                        <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Equipe</span>
                    </h1>
                </div>

                <div className="bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--glass-border)] flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                            ${viewMode === 'list'
                                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface)]'
                            }
                        `}
                    >
                        <List size={16} />
                        Lista
                    </button>
                    <button
                        onClick={() => setViewMode('organogram')}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                            ${viewMode === 'organogram'
                                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface)]'
                            }
                        `}
                    >
                        <Network size={16} />
                        Organograma
                    </button>
                </div>

                <button
                    onClick={handleNewMember}
                    className="btn btn-primary shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span>Novo Membro</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="stat-value">{users?.length || 0}</div>
                    <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Membros</div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <BarChart3 size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-cyan-400 font-display">{tasks?.length || 0}</div>
                    <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Tarefas Totais</div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <BarChart3 size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-400 font-display">
                        {tasks?.filter((t: any) => t.status === 'CONCLUIDA').length || 0}
                    </div>
                    <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Concluídas</div>
                </div>
            </div>

            {/* Team Members */}
            {viewMode === 'organogram' ? (
                <div className="h-[600px] animate-fade-in-up">
                    <OrganogramBoard />
                </div>
            ) : (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-xl font-bold font-display mb-6 flex items-center justify-between">
                        <span>Membros da Equipe</span>
                        <span className="text-sm font-normal text-[var(--text-muted)]">{users?.length} membros encontrados</span>
                    </h2>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[var(--glass-surface)] rounded-2xl animate-shimmer" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users?.map((user: User) => {
                                const stats = getTaskStats(user.id);
                                const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                                return (
                                    <div key={user.id} className="glass-card p-6 group relative hover:border-violet-500/30 transition-all duration-300">

                                        {/* Edit Button - Absolute Top Right */}
                                        <button
                                            onClick={() => handleEditMember(user)}
                                            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            title="Editar Membro"
                                        >
                                            <Edit2 size={16} />
                                        </button>

                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 p-0.5 shadow-lg shrink-0 overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                                                <div className="w-full h-full rounded-[14px] bg-black/40 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xl font-bold text-white">
                                                            {user.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <h3 className="font-bold text-[var(--text-main)] text-lg truncate pr-8">{user.nome}</h3>
                                                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-2">Member</div>

                                                <div className="flex flex-col gap-1">
                                                    {user.email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                                                            <Mail size={12} className="shrink-0" />
                                                            <span className="truncate">{user.email}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                                                        <Phone size={12} className="shrink-0" />
                                                        <span className="truncate">{user.telefone_whatsapp}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats & Progress */}
                                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-[var(--text-main)]">{stats.done}</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Feitas</div>
                                                </div>
                                                <div className="w-px h-8 bg-white/10" />
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-[var(--text-main)]">{stats.pending}</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Pendentes</div>
                                                </div>
                                                <div className="w-px h-8 bg-white/10" />
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-violet-400">{pct}%</div>
                                                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Taxa</div>
                                                </div>
                                            </div>

                                            <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
