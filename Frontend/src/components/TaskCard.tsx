import { Calendar, User, CheckCircle2, Trash2, ArrowUpRight, Repeat, GripVertical, Clock, Tag, AlertTriangle } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Task {
    id: string;
    titulo: string;
    prazo: string | null;
    status: 'PENDENTE' | 'EM_PROGRESSO' | 'CONCLUIDA';
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
    project?: { nome: string; cor: string } | null;
    responsavel?: { nome: string } | null;
    criador?: { nome: string } | null;
    responsavel_id?: string;
    criador_id?: string;
    isRecurring?: boolean;
    recurrenceInterval?: string;
    grupo?: string | null;
    subgrupo?: string | null;
}

interface TaskCardProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onClick?: () => void;
    isDraggable?: boolean;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

export const TaskCard = ({
    task,
    onToggle,
    onDelete,
    onClick,
    isDraggable = false,
    isSelectionMode = false,
    isSelected = false,
    onSelect
}: TaskCardProps) => {
    const isDone = task.status === 'CONCLUIDA';
    const isOverdue = !isDone && task.prazo && new Date(task.prazo) < new Date();

    const priorityConfig = {
        ALTA: { classes: 'tag-high', label: 'Alta' },
        MEDIA: { classes: 'tag-medium', label: 'Média' },
        BAIXA: { classes: 'tag-low', label: 'Baixa' },
    };

    const priority = priorityConfig[task.prioridade] || priorityConfig.BAIXA;

    // Draggable Hook
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id, disabled: !isDraggable || isSelectionMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    const formatPrazo = () => {
        if (!task.prazo) return null;
        const d = new Date(task.prazo);
        const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const hours = d.getHours();
        const minutes = d.getMinutes();
        const hasTime = hours !== 0 || minutes !== 0;
        const time = hasTime ? ` ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : '';
        return { date, time, hasTime };
    };

    const prazoInfo = formatPrazo();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            onDelete(task.id);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={isSelectionMode ? () => onSelect?.(task.id) : onClick}
            className={`
                task-card group cursor-pointer relative transition-all duration-200
                ${isDone ? 'opacity-60' : ''}
                ${isDragging ? 'shadow-2xl scale-105 rotate-1 ring-2 ring-violet-500' : ''}
                ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}
                ${isOverdue ? 'ring-1 ring-rose-500/50 bg-rose-500/5' : ''}
            `}
            {...attributes}
        >
            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="absolute top-4 right-4 z-20">
                    <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-transparent'}
                    `}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                </div>
            )}

            {/* Overdue Badge */}
            {isOverdue && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border border-rose-500/30 animate-pulse">
                    <AlertTriangle size={10} />
                    Atrasada
                </div>
            )}

            {/* Header: Priority & Project */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    {isDraggable && (
                        <div className="text-[var(--text-dim)] hover:text-white cursor-grab active:cursor-grabbing p-1 -ml-2" {...listeners}>
                            <GripVertical size={14} />
                        </div>
                    )}
                    <span className={`tag ${priority.classes}`}>
                        {priority.label}
                    </span>
                    {task.isRecurring && (
                        <span className="bg-blue-500/20 text-blue-400 p-1 rounded-md" title={`Recorrência: ${task.recurrenceInterval}`}>
                            <Repeat size={12} />
                        </span>
                    )}
                </div>
                {task.project && (
                    <span className="text-[10px] uppercase font-bold text-[var(--text-dim)] tracking-widest flex items-center gap-1">
                        {task.project.nome}
                        <ArrowUpRight size={10} />
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className={`
                font-display text-lg font-bold leading-snug mb-3
                ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-white group-hover:text-violet-200'}
                transition-colors
            `}>
                {task.titulo}
            </h3>

            {/* Grupo / Subgrupo Tags */}
            {(task.grupo || task.subgrupo) && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {task.grupo && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-300 px-2.5 py-1 rounded-lg border border-violet-500/20">
                            <Tag size={9} />
                            {task.grupo}
                        </span>
                    )}
                    {task.subgrupo && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                            {task.subgrupo}
                        </span>
                    )}
                </div>
            )}

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-muted)]">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${isOverdue ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-[var(--glass-surface)] border-[var(--glass-border)]'}`}>
                    <Calendar size={12} className={isOverdue ? 'text-rose-400' : 'text-violet-400'} />
                    <span>
                        {prazoInfo ? prazoInfo.date : 'Sem data'}
                    </span>
                    {prazoInfo?.hasTime && (
                        <>
                            <Clock size={10} className={isOverdue ? 'text-rose-400' : 'text-cyan-400'} />
                            <span className="font-semibold">{prazoInfo.time}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--glass-surface)] px-2.5 py-1.5 rounded-lg border border-[var(--glass-border)]">
                    <User size={12} className="text-cyan-400" />
                    <span>{task.responsavel?.nome || (task.responsavel_id === task.criador_id ? 'Eu' : 'User')}</span>
                </div>
            </div>

            {/* Action Buttons (Hover) */}
            {!isDragging && (
                <div className="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                        className={`
                            p-2.5 rounded-xl backdrop-blur-md border shadow-lg transition-all
                            ${isDone
                                ? 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500 hover:text-white'
                                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white hover:scale-110'
                            }
                        `}
                        title={isDone ? 'Desfazer' : 'Concluir'}
                    >
                        <CheckCircle2 size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white hover:scale-110 backdrop-blur-md shadow-lg transition-all"
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
