import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { SearchBar } from '../components/SearchBar';
import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { RotateCcw, Plus, Smartphone, Sparkles, TrendingUp, CheckCircle2, Wifi, Search, LayoutGrid, List, Kanban, ArrowDownUp, AlertTriangle, Inbox } from 'lucide-react';
import { ConnectWhatsapp } from '../components/ConnectWhatsapp';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from '../components/KanbanColumn';

const fetchTasks = async () => {
    const { data } = await api.get('/tasks');
    return data;
};

import { BulkActionBar } from '../components/BulkActionBar';

export const Dashboard = () => {
    const { user } = useStore();
    const addToast = useToastStore(s => s.addToast);
    const queryClient = useQueryClient();
    const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks, staleTime: 30000, refetchInterval: 30000 });
    const [filter, setFilter] = useState<'ALL' | 'PERSONAL' | 'SHARED' | 'ROUTINES'>('ALL');
    const [viewMode, setViewMode] = useState<'LIST' | 'GROUPED' | 'KANBAN'>('LIST');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [grupoFilter, setGrupoFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'RECENT' | 'DEADLINE' | 'PRIORITY'>('RECENT');

    // Bulk selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

    const toggleSelection = (id: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const { data: waStatus } = useQuery({
        queryKey: ['whatsapp-status'],
        queryFn: () => api.get('/whatsapp/status').then(r => r.data).catch(() => ({ isReady: false })),
        staleTime: 15000,
        refetchInterval: 15000,
    });

    // Deadline notification: toast when a task is due within 1 hour
    useEffect(() => {
        if (!tasks || tasks.length === 0) return;
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const urgentTasks = tasks.filter((t: any) =>
            t.status !== 'CONCLUIDA' && t.prazo &&
            new Date(t.prazo) > now && new Date(t.prazo) <= oneHourFromNow
        );
        urgentTasks.forEach((t: any) => {
            const mins = Math.round((new Date(t.prazo).getTime() - now.getTime()) / 60000);
            addToast(`⏰ "${t.titulo}" vence em ${mins} min!`, 'warning');
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks?.length]);

    const toggleMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/tasks/${id}/toggle`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); addToast('Status atualizado!', 'success'); },
        onError: () => addToast('Erro ao atualizar tarefa', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/tasks/${id}`),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); addToast('Tarefa excluída', 'success'); },
        onError: () => addToast('Erro ao excluir tarefa', 'error'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => api.put(`/tasks/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            addToast('Tarefa movida!', 'success');
        },
        onError: () => addToast('Erro ao mover tarefa', 'error'),
    });

    const restartWhatsappMutation = useMutation({
        mutationFn: () => api.post('/whatsapp/restart'),
        onSuccess: () => addToast('Reiniciando WhatsApp...', 'info'),
        onError: () => addToast('Erro ao reiniciar WhatsApp', 'error'),
    });

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as string;

        const task = tasks?.find((t: any) => t.id === taskId);
        if (task && task.status !== newStatus) {
            updateStatusMutation.mutate({ id: taskId, status: newStatus });
        }
    };

    // Keyboard shortcuts: Cmd+K (search), N (new task), S (selection)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            if (!isTyping && !e.metaKey && !e.ctrlKey) {
                if (e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    setIsCreateOpen(true);
                }
                if (e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    setIsSelectionMode(prev => !prev);
                    setSelectedTaskIds([]);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Collect unique groups for the filter dropdown
    const uniqueGrupos: string[] = Array.from(new Set(tasks?.map((t: any) => t.grupo).filter(Boolean) || []));

    const filteredTasks = tasks?.filter((t: any) => {
        // Status/ownership filter
        if (filter === 'ROUTINES' && !t.isRecurring) return false;
        if (filter === 'PERSONAL' && t.responsavel_id !== user?.id) return false;
        if (filter === 'SHARED' && t.responsavel_id === user?.id) return false;
        // Grupo filter
        if (grupoFilter !== 'ALL' && t.grupo !== grupoFilter) return false;
        return true;
    });

    // Sort tasks
    const sortedTasks = filteredTasks ? [...filteredTasks].sort((a: any, b: any) => {
        if (sortBy === 'DEADLINE') {
            if (!a.prazo && !b.prazo) return 0;
            if (!a.prazo) return 1;
            if (!b.prazo) return -1;
            return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
        }
        if (sortBy === 'PRIORITY') {
            const order: Record<string, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
            return (order[a.prioridade] ?? 1) - (order[b.prioridade] ?? 1);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }) : [];

    const groupedTasks = () => {
        if (!sortedTasks) return {};
        const groups: Record<string, any[]> = {};

        sortedTasks.forEach((t: any) => {
            // Group by grupo first, then fallback to project, then 'Sem Grupo'
            const key = t.grupo || (t.project ? t.project.nome : 'Sem Grupo');
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return groups;
    };

    const kanbanTasks = {
        PENDENTE: sortedTasks?.filter((t: any) => t.status === 'PENDENTE') || [],
        EM_PROGRESSO: sortedTasks?.filter((t: any) => t.status === 'EM_PROGRESSO') || [],
        CONCLUIDA: sortedTasks?.filter((t: any) => t.status === 'CONCLUIDA') || [],
    };

    const completedCount = tasks?.filter((t: any) => t.status === 'CONCLUIDA').length || 0;
    const inProgressCount = tasks?.filter((t: any) => t.status === 'EM_PROGRESSO').length || 0;
    const overdueCount = tasks?.filter((t: any) => t.status !== 'CONCLUIDA' && t.prazo && new Date(t.prazo) < new Date()).length || 0;

    return (
        <div className="p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto pb-32">
            <BulkActionBar selectedIds={selectedTaskIds} onClearSelection={() => { setIsSelectionMode(false); setSelectedTaskIds([]); }} />

            {/* Modals */}
            <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <TaskDetailModal task={selectedTask} isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} />
            <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectTask={setSelectedTask} />

            {/* Header Section */}
            <header className="flex flex-col lg:flex-row justify-between lg:items-end mb-10 gap-6 animate-fade-in-up">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Bem-vindo, {user?.nome?.split(' ')[0] || 'usuário'}</span>
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                            <Sparkles size={10} /> PRO
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                        Minhas <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Tarefas</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedTaskIds([]);
                        }}
                        className={`btn-ghost flex items-center gap-2 h-11 px-5 ${isSelectionMode ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : ''}`}
                    >
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-medium hidden sm:inline">{isSelectionMode ? 'Cancelar Seleção' : 'Selecionar'}</span>
                    </button>

                    {/* View Toggle */}
                    <div className="flex items-center bg-[var(--glass-surface)] rounded-lg p-1 border border-[var(--glass-border)] mr-2">
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-violet-500/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            title="Lista"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('GROUPED')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'GROUPED' ? 'bg-violet-500/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            title="Agrupar por Projeto"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('KANBAN')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'KANBAN' ? 'bg-violet-500/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                            title="Kanban Board"
                        >
                            <Kanban size={18} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="btn-ghost flex items-center gap-2 h-11 px-5"
                    >
                        <Search size={16} />
                        <span className="text-sm font-medium hidden sm:inline">Buscar</span>
                        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-bold text-[var(--text-dim)] bg-[var(--glass-surface)] px-1.5 py-0.5 rounded-md border border-[var(--glass-border)] ml-1">
                            ⌘K
                        </kbd>
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn btn-primary h-11 px-6"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Nova Tarefa</span>
                    </button>
                </div>
            </header>

            {/* Stats Row */}
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

            {/* Tasks Area */}
            <div className="flex flex-col xl:flex-row gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex-1 min-w-0">
                    {/* Filter Row */}
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
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="h-11 px-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-sm font-semibold text-[var(--text-main)] appearance-none cursor-pointer hover:border-violet-500/40 transition-all focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                            >
                                <option value="RECENT">Mais Recentes</option>
                                <option value="DEADLINE">Prazo Mais Próximo</option>
                                <option value="PRIORITY">Prioridade Alta</option>
                            </select>
                        </div>
                    </div>

                    {/* Task Grid / Board */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="task-card animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="h-6 w-16 bg-[var(--glass-surface)] rounded-lg" />
                                        <div className="h-4 w-20 bg-[var(--glass-surface)] rounded-lg" />
                                    </div>
                                    <div className="h-6 w-3/4 bg-[var(--glass-surface)] rounded-lg mb-3" />
                                    <div className="h-4 w-1/2 bg-[var(--glass-surface)] rounded-lg mb-4" />
                                    <div className="flex gap-3">
                                        <div className="h-8 w-24 bg-[var(--glass-surface)] rounded-lg" />
                                        <div className="h-8 w-20 bg-[var(--glass-surface)] rounded-lg" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        viewMode === 'KANBAN' ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCorners}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-320px)] items-start">
                                    <KanbanColumn
                                        id="PENDENTE"
                                        title="Pendente"
                                        tasks={kanbanTasks.PENDENTE}
                                        color="border-gray-500/50 text-gray-400"
                                        icon={Smartphone}
                                        onToggle={(id) => toggleMutation.mutate(id)}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        onClick={setSelectedTask}
                                    />
                                    <KanbanColumn
                                        id="EM_PROGRESSO"
                                        title="Em Progresso"
                                        tasks={kanbanTasks.EM_PROGRESSO}
                                        color="border-blue-500/50 text-blue-400"
                                        icon={TrendingUp}
                                        onToggle={(id) => toggleMutation.mutate(id)}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        onClick={setSelectedTask}
                                    />
                                    <KanbanColumn
                                        id="CONCLUIDA"
                                        title="Concluída"
                                        tasks={kanbanTasks.CONCLUIDA}
                                        color="border-emerald-500/50 text-emerald-400"
                                        icon={CheckCircle2}
                                        onToggle={(id) => toggleMutation.mutate(id)}
                                        onDelete={(id) => deleteMutation.mutate(id)}
                                        onClick={setSelectedTask}
                                    />
                                </div>
                                <DragOverlay>
                                    {activeId ? (
                                        <div className="opacity-90 rotate-2 scale-105 cursor-grabbing pointer-events-none">
                                            <TaskCard
                                                task={tasks.find((t: any) => t.id === activeId)}
                                                onToggle={() => { }}
                                                onDelete={() => { }}
                                                isDraggable
                                            />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        ) : viewMode === 'LIST' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {sortedTasks?.map((task: any, index: number) => (
                                    <div key={task.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}>
                                        <TaskCard
                                            task={task}
                                            onToggle={(id) => toggleMutation.mutate(id)}
                                            onDelete={(id) => deleteMutation.mutate(id)}
                                            onClick={() => setSelectedTask(task)}
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedTaskIds.includes(task.id)}
                                            onSelect={toggleSelection}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedTasks()).map(([project, projectTasks], pIndex) => (
                                    <div key={project} className="animate-fade-in-up" style={{ animationDelay: `${pIndex * 0.1}s` }}>
                                        <h3 className="text-xl font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                                            <span className="w-2 h-8 rounded-full bg-gradient-to-b from-violet-500 to-cyan-500 block" />
                                            {project}
                                            <span className="text-sm font-medium text-[var(--text-muted)] ml-2 bg-[var(--glass-surface)] px-2 py-0.5 rounded-full border border-[var(--glass-border)]">
                                                {projectTasks.length}
                                            </span>
                                        </h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {projectTasks.map((task: any) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    onToggle={(id) => toggleMutation.mutate(id)}
                                                    onDelete={(id) => deleteMutation.mutate(id)}
                                                    onClick={() => setSelectedTask(task)}
                                                    isSelectionMode={isSelectionMode}
                                                    isSelected={selectedTaskIds.includes(task.id)}
                                                    onSelect={toggleSelection}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {sortedTasks?.length === 0 && !isLoading && (
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
                                onClick={() => setIsCreateOpen(true)}
                                className="btn btn-primary px-6 h-11"
                            >
                                <Plus size={18} />
                                <span>Criar Tarefa</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* WhatsApp QR Section */}
                <div className="w-full xl:w-[340px] shrink-0">
                    <div className="glass-card p-6 sticky top-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                                <Smartphone size={18} />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-[var(--text-main)]">Conexão WhatsApp</h3>
                                <p className="text-xs text-[var(--text-muted)]">Escaneie para conectar</p>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-2xl shadow-violet-500/5">
                            <div className="flex justify-center">
                                <ConnectWhatsapp />
                            </div>
                        </div>

                        <p className="text-xs text-center text-[var(--text-muted)] mt-5 leading-relaxed">
                            Mensagens recebidas no WhatsApp serão convertidas automaticamente em tarefas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
