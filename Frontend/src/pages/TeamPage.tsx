import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Users, Sparkles, Mail, Phone, BarChart3, Plus, Edit2, List, Network, FolderKanban, Trash2, UserPlus, MoveRight } from 'lucide-react';
import { MemberModal } from '../components/MemberModal';
import { OrganogramBoard } from '../components/OrganogramBoard';
import { useToastStore } from '../store/useToastStore';
import type { User } from '../types';

export const TeamPage = () => {
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<User | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'organogram' | 'teams'>('list');
    const [newTeamName, setNewTeamName] = useState('');
    const [showTeamCreate, setShowTeamCreate] = useState(false);
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string | null>(null);
    const [movingUser, setMovingUser] = useState<{ userId: string; userName: string } | null>(null);
    const addToast = useToastStore(s => s.addToast);
    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data.data ?? r.data),
    });

    const { data: tasks } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => api.get('/tasks?limit=100').then(r => r.data.data ?? r.data),
    });

    const { data: teams } = useQuery({
        queryKey: ['teams'],
        queryFn: () => api.get('/teams').then(r => r.data.data ?? r.data),
    });

    const createTeamMutation = useMutation({
        mutationFn: (nome: string) => api.post('/teams', { nome }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            addToast('Equipe criada!', 'success');
            setNewTeamName('');
            setShowTeamCreate(false);
        },
        onError: () => addToast('Erro ao criar equipe', 'error'),
    });

    const deleteTeamMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/teams/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            addToast('Equipe removida', 'success');
        },
        onError: () => addToast('Erro ao remover equipe', 'error'),
    });

    const moveUserMutation = useMutation({
        mutationFn: ({ userId, targetTeamId }: { userId: string; targetTeamId: string | null }) =>
            api.post('/teams/move-member', { userId, targetTeamId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addToast('Membro movido!', 'success');
            setMovingUser(null);
        },
        onError: () => addToast('Erro ao mover membro', 'error'),
    });

    const getTaskStats = (userId: string) => {
        if (!tasks) return { total: 0, done: 0, pending: 0 };
        const userTasks = tasks.filter((t: any) => t.responsavel_id === userId);
        const done = userTasks.filter((t: any) => t.status === 'CONCLUIDA').length;
        return { total: userTasks.length, done, pending: userTasks.length - done };
    };

    const getUserTeam = (userId: string) => {
        if (!teams) return null;
        for (const team of teams) {
            if (team.members?.some((m: any) => m.user_id === userId)) {
                return team;
            }
        }
        return null;
    };

    const handleEditMember = (user: User) => {
        setEditingMember(user);
        setIsMemberModalOpen(true);
    };

    const handleNewMember = () => {
        setEditingMember(null);
        setIsMemberModalOpen(true);
    };

    const filteredUsers = selectedTeamFilter
        ? users?.filter((u: User) => {
            const team = getUserTeam(u.id);
            return team?.id === selectedTeamFilter;
        })
        : users;

    return (
        <div className="p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto pb-32">
            <MemberModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                member={editingMember}
                teams={teams || []}
            />

            {/* Move User Modal */}
            {movingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--glass-surface)] border border-[var(--glass-border)] w-full max-w-sm rounded-2xl shadow-2xl p-6">
                        <h3 className="font-bold text-lg text-[var(--text-main)] mb-4 flex items-center gap-2">
                            <MoveRight className="text-violet-400" size={20} />
                            Mover {movingUser.userName}
                        </h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            <button
                                onClick={() => moveUserMutation.mutate({ userId: movingUser.userId, targetTeamId: null })}
                                className="w-full text-left p-3 rounded-xl bg-black/20 border border-[var(--glass-border)] hover:border-rose-500/30 text-[var(--text-secondary)] text-sm transition-all"
                            >
                                ❌ Remover de todas as equipes
                            </button>
                            {teams?.map((team: any) => (
                                <button
                                    key={team.id}
                                    onClick={() => moveUserMutation.mutate({ userId: movingUser.userId, targetTeamId: team.id })}
                                    className="w-full text-left p-3 rounded-xl bg-black/20 border border-[var(--glass-border)] hover:border-violet-500/30 text-[var(--text-secondary)] text-sm transition-all"
                                >
                                    👥 {team.nome} ({team._count?.members || team.members?.length || 0} membros)
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setMovingUser(null)} className="btn-ghost w-full mt-4">Cancelar</button>
                    </div>
                </div>
            )}

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

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--glass-border)] flex items-center gap-1">
                        <ViewModeBtn active={viewMode === 'list'} onClick={() => setViewMode('list')} icon={<List size={16} />} label="Lista" />
                        <ViewModeBtn active={viewMode === 'teams'} onClick={() => setViewMode('teams')} icon={<FolderKanban size={16} />} label="Equipes" />
                        <ViewModeBtn active={viewMode === 'organogram'} onClick={() => setViewMode('organogram')} icon={<Network size={16} />} label="Organograma" />
                    </div>

                    <button
                        onClick={handleNewMember}
                        className="btn btn-primary shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Novo Membro</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <FolderKanban size={18} />
                        </div>
                    </div>
                    <div className="text-3xl font-extrabold text-orange-400 font-display">{teams?.length || 0}</div>
                    <div className="text-[var(--text-muted)] text-sm font-medium mt-1">Equipes</div>
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

            {/* Teams View */}
            {viewMode === 'teams' && (
                <div className="animate-fade-in-up mb-10" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold font-display">Equipes</h2>
                        <button
                            onClick={() => setShowTeamCreate(!showTeamCreate)}
                            className="btn bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20"
                        >
                            <Plus size={16} /> Nova Equipe
                        </button>
                    </div>

                    {showTeamCreate && (
                        <div className="glass-card p-4 mb-6 flex gap-3 items-end animate-fade-in-up">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Nome da Equipe</label>
                                <input
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="Ex: Marketing, Vendas..."
                                    className="w-full px-4 py-2.5 bg-black/20 border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-violet-500/50 outline-none text-[var(--text-main)] placeholder:text-[var(--text-dim)]"
                                    onKeyDown={e => e.key === 'Enter' && newTeamName.trim() && createTeamMutation.mutate(newTeamName.trim())}
                                />
                            </div>
                            <button
                                onClick={() => newTeamName.trim() && createTeamMutation.mutate(newTeamName.trim())}
                                disabled={!newTeamName.trim()}
                                className="btn btn-primary"
                            >
                                Criar
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams?.map((team: any) => {
                            const memberCount = team._count?.members || team.members?.length || 0;
                            const teamMembers = team.members?.map((m: any) => m.user) || [];
                            return (
                                <div key={team.id} className="glass-card p-5 group relative hover:border-violet-500/30 transition-all">
                                    <button
                                        onClick={() => {
                                            if (confirm(`Remover equipe "${team.nome}"?`)) {
                                                deleteTeamMutation.mutate(team.id);
                                            }
                                        }}
                                        className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 text-[var(--text-dim)] hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                                            {team.nome.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--text-main)]">{team.nome}</h3>
                                            <span className="text-xs text-[var(--text-muted)]">{memberCount} membro(s)</span>
                                        </div>
                                    </div>

                                    {teamMembers.length > 0 ? (
                                        <div className="space-y-2">
                                            {teamMembers.map((user: any) => (
                                                <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg bg-black/20">
                                                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                                                        {user.nome?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-[var(--text-secondary)] flex-1 truncate">{user.nome}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[var(--text-dim)] italic">Nenhum membro</p>
                                    )}

                                    <button
                                        onClick={() => setSelectedTeamFilter(selectedTeamFilter === team.id ? null : team.id)}
                                        className={`mt-4 w-full text-xs font-medium py-2 rounded-lg transition-all ${selectedTeamFilter === team.id
                                                ? 'bg-violet-500/20 text-violet-400'
                                                : 'bg-black/10 text-[var(--text-muted)] hover:bg-violet-500/10 hover:text-violet-400'
                                            }`}
                                    >
                                        {selectedTeamFilter === team.id ? '✓ Filtro ativo' : 'Filtrar membros'}
                                    </button>
                                </div>
                            );
                        })}

                        {(!teams || teams.length === 0) && (
                            <div className="col-span-full text-center py-12">
                                <FolderKanban size={40} className="text-[var(--text-dim)] mx-auto mb-4" />
                                <p className="text-[var(--text-muted)]">Nenhuma equipe criada ainda.</p>
                                <button onClick={() => setShowTeamCreate(true)} className="btn btn-primary mt-4">
                                    <Plus size={16} /> Criar Primeira Equipe
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Organogram View */}
            {viewMode === 'organogram' && (
                <div className="h-[600px] animate-fade-in-up">
                    <OrganogramBoard />
                </div>
            )}

            {/* List View */}
            {(viewMode === 'list' || viewMode === 'teams') && (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-xl font-bold font-display mb-6 flex items-center justify-between">
                        <span>
                            Membros da Equipe
                            {selectedTeamFilter && (
                                <button onClick={() => setSelectedTeamFilter(null)} className="ml-3 text-xs font-normal text-violet-400 hover:text-violet-300">
                                    ✕ Limpar filtro
                                </button>
                            )}
                        </span>
                        <span className="text-sm font-normal text-[var(--text-muted)]">{filteredUsers?.length || 0} membros encontrados</span>
                    </h2>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[var(--glass-surface)] rounded-2xl animate-shimmer" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers?.map((user: User) => {
                                const stats = getTaskStats(user.id);
                                const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
                                const userTeam = getUserTeam(user.id);
                                return (
                                    <div key={user.id} className="glass-card p-6 group relative hover:border-violet-500/30 transition-all duration-300">

                                        {/* Action Buttons */}
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setMovingUser({ userId: user.id, userName: user.nome })}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-cyan-400 transition-colors"
                                                title="Mover para equipe"
                                            >
                                                <MoveRight size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleEditMember(user)}
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
                                                title="Editar Membro"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>

                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 p-0.5 shadow-lg shrink-0 overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                                                <div className="w-full h-full rounded-[14px] bg-black/40 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg font-bold text-white">
                                                            {user.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <h3 className="font-bold text-[var(--text-main)] text-lg truncate pr-16">{user.nome}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {userTeam ? (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-semibold">{userTeam.nome}</span>
                                                    ) : (
                                                        <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-semibold">Sem Equipe</span>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-1 mt-2">
                                                    {(user as any).email && (
                                                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                                                            <Mail size={12} className="shrink-0" />
                                                            <span className="truncate">{(user as any).email}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                                                        <Phone size={12} className="shrink-0" />
                                                        <span className="truncate">{user.telefone_whatsapp || (user as any).whatsapp}</span>
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

const ViewModeBtn = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${active
                ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface)]'
            }
        `}
    >
        {icon}
        {label}
    </button>
);
