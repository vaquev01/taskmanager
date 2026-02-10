import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import type { LucideIcon } from 'lucide-react';

interface KanbanColumnProps {
    id: string;
    title: string;
    tasks: any[];
    color: string;
    icon: LucideIcon;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onClick: (task: any) => void;
}

export const KanbanColumn = ({ id, title, tasks, color, icon: Icon, onToggle, onDelete, onClick }: KanbanColumnProps) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[320px] bg-[var(--glass-surface)]/50 rounded-2xl border border-[var(--glass-border)] p-4 shadow-lg backdrop-blur-sm">
            {/* Column Header */}
            <div className={`flex items-center justify-between mb-4 pb-3 border-b border-[var(--glass-border)] ${color}`}>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-current/10">
                        <Icon size={16} />
                    </div>
                    <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--glass-surface)] border border-[var(--glass-border)] opacity-70">
                    {tasks.length}
                </span>
            </div>

            {/* Droppable Area */}
            <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[100px]">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onClick={() => onClick(task)}
                            isDraggable={true}
                        />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="h-full border-2 border-dashed border-[var(--glass-border)] rounded-xl flex items-center justify-center text-[var(--text-dim)] text-xs font-medium opacity-50 min-h-[120px]">
                        Arraste para cá
                    </div>
                )}
            </div>
        </div>
    );
};
