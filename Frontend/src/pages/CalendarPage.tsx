import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { TaskDetailModal } from '../components/TaskDetailModal';

export const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const { data: tasks, isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => api.get('/tasks').then(r => r.data),
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1));

    const getTasksForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return tasks?.filter((t: any) => {
            if (!t.prazo) return false;
            return t.prazo.startsWith(dateStr);
        }) || [];
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const isToday = (day: number) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const selectedTasks = selectedDate ? tasks?.filter((t: any) => t.prazo?.startsWith(selectedDate)) || [] : [];

    const priorityColors: Record<string, string> = {
        ALTA: 'bg-rose-500',
        MEDIA: 'bg-yellow-500',
        BAIXA: 'bg-green-500',
    };

    return (
        <div className="p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto">
            <TaskDetailModal task={selectedTask} isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} />
            {/* Header */}
            <div className="mb-10 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Organização Visual</span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles size={10} /> PRO
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Calendário</span>
                </h1>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {/* Calendar Grid */}
                <div className="flex-1">
                    <div className="glass-card p-6">
                        {/* Nav */}
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-[var(--glass-surface)] text-[var(--text-muted)] hover:text-white transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="text-xl font-bold font-display capitalize">{monthName}</h2>
                            <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-[var(--glass-surface)] text-[var(--text-muted)] hover:text-white transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map(d => (
                                <div key={d} className="text-center text-xs font-bold text-[var(--text-dim)] uppercase py-2">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {isLoading ? (
                                Array.from({ length: 35 }).map((_, i) => (
                                    <div key={i} className="aspect-square rounded-xl bg-[var(--glass-surface)] animate-shimmer" />
                                ))
                            ) : (
                                days.map((day, i) => {
                                    if (day === null) return <div key={`empty-${i}`} />;
                                    const dayTasks = getTasksForDay(day);
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const isSelected = selectedDate === dateStr;

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                                            className={`
                                                relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all
                                                ${isToday(day) ? 'bg-violet-500/20 text-violet-400 font-bold' : ''}
                                                ${isSelected ? 'bg-violet-500/30 ring-2 ring-violet-500/50' : ''}
                                                ${!isToday(day) && !isSelected ? 'hover:bg-[var(--glass-surface)] text-[var(--text-secondary)]' : ''}
                                            `}
                                        >
                                            <span className="text-sm font-semibold">{day}</span>
                                            {dayTasks.length > 0 && (
                                                <div className="flex gap-0.5 mt-1">
                                                    {dayTasks.slice(0, 3).map((t: any, idx: number) => (
                                                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${priorityColors[t.prioridade] || 'bg-gray-500'}`} />
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Selected Day Tasks */}
                <div className="w-full xl:w-[340px] shrink-0">
                    <div className="glass-card p-6 sticky top-6">
                        <h3 className="font-display font-bold text-lg mb-4">
                            {selectedDate
                                ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                                : 'Selecione um dia'
                            }
                        </h3>
                        {!selectedDate ? (
                            <p className="text-sm text-[var(--text-muted)]">Clique em um dia para ver as tarefas.</p>
                        ) : selectedTasks.length === 0 ? (
                            <p className="text-sm text-[var(--text-muted)]">Nenhuma tarefa para este dia.</p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {selectedTasks.map((task: any) => (
                                    <div key={task.id} onClick={() => setSelectedTask(task)} className="p-4 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] cursor-pointer hover:border-violet-500/30 transition-all">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${priorityColors[task.prioridade] || 'bg-gray-500'}`} />
                                            <span className="text-xs font-bold text-[var(--text-muted)] uppercase">{task.prioridade}</span>
                                        </div>
                                        <h4 className="font-semibold text-white">{task.titulo}</h4>
                                        {task.project && <p className="text-xs text-[var(--text-dim)] mt-1">{task.project.nome}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
