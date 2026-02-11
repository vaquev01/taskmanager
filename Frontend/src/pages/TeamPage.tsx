import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Users, Sparkles, Mail, Phone, BarChart3 } from 'lucide-react';

export const TeamPage = () => {
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

    return (
        <div className="p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-10 animate-fade-in-up">
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
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-xl font-bold font-display mb-6">Membros da Equipe</h2>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2].map(i => <div key={i} className="h-40 bg-[var(--glass-surface)] rounded-2xl animate-shimmer" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users?.map((user: any) => {
                            const stats = getTaskStats(user.id);
                            const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                            return (
                                <div key={user.id} className="glass-card p-6 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-lg font-bold text-white shadow-lg shrink-0 overflow-hidden">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
                                            ) : (
                                                user.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[var(--text-main)] text-lg">{user.nome}</h3>
                                            {user.email && (
                                                <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-1">
                                                    <Mail size={12} />
                                                    <span className="truncate">{user.email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                                                <Phone size={12} />
                                                <span>{user.telefone_whatsapp}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mt-5">
                                        <div className="flex items-center justify-between text-xs font-medium mb-2">
                                            <span className="text-[var(--text-muted)]">{stats.done}/{stats.total} tarefas</span>
                                            <span className="text-violet-400 font-bold">{pct}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[var(--glass-surface)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-500"
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
        </div>
    );
};
