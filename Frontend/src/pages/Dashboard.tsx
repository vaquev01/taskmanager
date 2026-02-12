import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { TaskCard } from '../components/TaskCard';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { SearchBar } from '../components/SearchBar';
import { StatsGrid } from '../components/StatsGrid';
import { FilterBar } from '../components/FilterBar';
import { EmptyState } from '../components/EmptyState';
import { BulkActionBar } from '../components/BulkActionBar';
import { ConnectWhatsapp } from '../components/ConnectWhatsapp';
import { KanbanColumn } from '../components/KanbanColumn';
import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { Plus, Sparkles, CheckCircle2, Search, LayoutGrid, List, Kanban, Smartphone, TrendingUp } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, FilterType, ViewMode, SortBy } from '../types';

const fetchTasks = async (): Promise<Task[]> => {
    const { data } = await api.get('/tasks');
    return data;
};

export const Dashboard = () => {
    const { user } = useStore();
    const addToast = useToastStore(s => s.addToast);
    const queryClient = useQueryClient();
    const { data: tasks, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: fetchTasks, staleTime: 30000, refetchInterval: 30000 });

    // UI state
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [grupoFilter, setGrupoFilter] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<SortBy>('RECENT');

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
        const urgentTasks = tasks.filter((t) =>
            t.status !== 'CONCLUIDA' && t.prazo &&
            new Date(t.prazo) > now && new Date(t.prazo) <= oneHourFromNow
        );
        urgentTasks.forEach((t) => {
            const mins = Math.round((new Date(t.prazo!).getTime() - now.getTime()) / 60000);
            addToast(`⏰ "${t.titulo}" vence em ${mins} min!`, 'warning');
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks?.length]);

    // Mutations
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
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tasks'] }); addToast('Tarefa movida!', 'success'); },
        onError: () => addToast('Erro ao mover tarefa', 'error'),
    });

    const restartWhatsappMutation = useMutation({
        mutationFn: () => api.post('/whatsapp/restart'),
        onSuccess: () => addToast('Reiniciando WhatsApp...', 'info'),
        onError: (err) => console.error('Silent error restarting WhatsApp:', err),
    });

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        const taskId = active.id as string;
        const newStatus = over.id as string;
        const task = tasks?.find((t) => t.id === taskId);
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
                if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setIsCreateOpen(true); }
                if (e.key === 's' || e.key === 'S') { e.preventDefault(); setIsSelectionMode(prev => !prev); setSelectedTaskIds([]); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Derived data
    const uniqueGrupos: string[] = Array.from(new Set(tasks?.map((t) => t.grupo).filter(Boolean) as string[] || []));

    const filteredTasks = tasks?.filter((t) => {
        if (filter === 'ROUTINES' && !t.isRecurring) return false;
        if (filter === 'PERSONAL' && t.responsavel_id !== user?.id) return false;
        if (filter === 'SHARED' && t.responsavel_id === user?.id) return false;
        if (grupoFilter !== 'ALL' && t.grupo !== grupoFilter) return false;
        return true;
    });

    const sortedTasks = filteredTasks ? [...filteredTasks].sort((a, b) => {
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

    const groupedTasks = (): Record<string, Task[]> => {
        if (!sortedTasks) return {};
        const groups: Record<string, Task[]> = {};
        sortedTasks.forEach((t) => {
            const key = t.grupo || (t.project ? t.project.nome : 'Sem Grupo');
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return groups;
    };

    const kanbanTasks = {
        PENDENTE: sortedTasks?.filter((t) => t.status === 'PENDENTE') || [],
        EM_PROGRESSO: sortedTasks?.filter((t) => t.status === 'EM_PROGRESSO') || [],
        CONCLUIDA: sortedTasks?.filter((t) => t.status === 'CONCLUIDA') || [],
    };

    const completedCount = tasks?.filter((t) => t.status === 'CONCLUIDA').length || 0;
    const inProgressCount = tasks?.filter((t) => t.status === 'EM_PROGRESSO').length || 0;
    const overdueCount = tasks?.filter((t) => t.status !== 'CONCLUIDA' && t.prazo && new Date(t.prazo) < new Date()).length || 0;

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
                        onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedTaskIds([]); }}
                        className={`btn-ghost flex items-center gap-2 h-11 px-5 ${isSelectionMode ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : ''}`}
                    >
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-medium hidden sm:inline">{isSelectionMode ? 'Cancelar Seleção' : 'Selecionar'}</span>
                    </button>

                    {/* View Toggle */}
                    <div className="flex items-center bg-[var(--glass-surface)] rounded-lg p-1 border border-[var(--glass-border)] mr-2">
                        {([
                            { mode: 'LIST' as const, icon: List, title: 'Lista' },
                            { mode: 'GROUPED' as const, icon: LayoutGrid, title: 'Agrupar' },
                            { mode: 'KANBAN' as const, icon: Kanban, title: 'Kanban' },
                        ]).map(({ mode, icon: Icon, title }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`p-2 rounded-md transition-all ${viewMode === mode ? 'bg-violet-500/20 text-violet-300' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                title={title}
                            >
                                <Icon size={18} />
                            </button>
                        ))}
                    </div>

                    <button onClick={() => setIsSearchOpen(true)} className="btn-ghost flex items-center gap-2 h-11 px-5">
                        <Search size={16} />
                        <span className="text-sm font-medium hidden sm:inline">Buscar</span>
                        <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-bold text-[var(--text-dim)] bg-[var(--glass-surface)] px-1.5 py-0.5 rounded-md border border-[var(--glass-border)] ml-1">⌘K</kbd>
                    </button>
                    <button onClick={() => setIsCreateOpen(true)} className="btn btn-primary h-11 px-6">
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Nova Tarefa</span>
                    </button>
                </div>
            </header>

            {/* Stats */}
            <StatsGrid
                tasks={tasks}
                completedCount={completedCount}
                inProgressCount={inProgressCount}
                overdueCount={overdueCount}
                waStatus={waStatus}
                restartWhatsappMutation={restartWhatsappMutation}
            />

            {/* Tasks Area */}
            <div className="flex flex-col xl:flex-row gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex-1 min-w-0">
                    <FilterBar
                        filter={filter}
                        setFilter={setFilter}
                        grupoFilter={grupoFilter}
                        setGrupoFilter={setGrupoFilter}
                        uniqueGrupos={uniqueGrupos}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />

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
                            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-320px)] items-start">
                                    <KanbanColumn id="PENDENTE" title="Pendente" tasks={kanbanTasks.PENDENTE} color="border-gray-500/50 text-gray-400" icon={Smartphone}
                                        onToggle={(id) => toggleMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} onClick={setSelectedTask} />
                                    <KanbanColumn id="EM_PROGRESSO" title="Em Progresso" tasks={kanbanTasks.EM_PROGRESSO} color="border-blue-500/50 text-blue-400" icon={TrendingUp}
                                        onToggle={(id) => toggleMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} onClick={setSelectedTask} />
                                    <KanbanColumn id="CONCLUIDA" title="Concluída" tasks={kanbanTasks.CONCLUIDA} color="border-emerald-500/50 text-emerald-400" icon={CheckCircle2}
                                        onToggle={(id) => toggleMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} onClick={setSelectedTask} />
                                </div>
                                <DragOverlay>
                                    {activeId ? (
                                        <div className="opacity-90 rotate-2 scale-105 cursor-grabbing pointer-events-none">
                                            <TaskCard task={tasks!.find((t) => t.id === activeId)!} onToggle={() => { }} onDelete={() => { }} isDraggable />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        ) : viewMode === 'LIST' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {sortedTasks?.map((task, index) => (
                                    <div key={task.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}>
                                        <TaskCard task={task} onToggle={(id) => toggleMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)}
                                            onClick={() => setSelectedTask(task)} isSelectionMode={isSelectionMode} isSelected={selectedTaskIds.includes(task.id)} onSelect={toggleSelection} />
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
                                            {projectTasks.map((task) => (
                                                <TaskCard key={task.id} task={task} onToggle={(id) => toggleMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)}
                                                    onClick={() => setSelectedTask(task)} isSelectionMode={isSelectionMode} isSelected={selectedTaskIds.includes(task.id)} onSelect={toggleSelection} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {sortedTasks?.length === 0 && !isLoading && (
                        <EmptyState onCreateTask={() => setIsCreateOpen(true)} />
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
