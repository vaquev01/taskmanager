import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    type DragStartEvent,
    type DragEndEvent,
    defaultDropAnimationSideEffects,
    type DropAnimation,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import api from '../lib/api';
import { Plus, Trash2, Edit2, GripVertical, Users as UsersIcon } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

// --- Types ---

interface User {
    id: string;
    nome: string;
    avatar?: string;
    role?: string;
}

interface TeamMember {
    user: User;
    user_id: string;
    team_id: string;
}

interface Team {
    id: string;
    nome: string;
    members: TeamMember[];
}

interface BoardContainerProps {
    team: Team | null; // null for "Unassigned"
    members: User[];
    onEdit?: (team: Team) => void;
    onDelete?: (teamId: string) => void;
}

// --- Components ---

const MemberCard = ({ user, isOverlay }: { user: User; isOverlay?: boolean }) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: user.id,
        data: { type: 'Member', user },
    });

    const style = {
        transition,
        transform: CSS.Translate.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-40 bg-[var(--bg-card)] p-3 rounded-lg border-2 border-violet-500/50 h-[60px]"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--glass-border)]
                hover:border-violet-500/30 hover:bg-[var(--glass-surface-hover)]
                transition-all cursor-grab active:cursor-grabbing group
                flex items-center gap-3 relative
                ${isOverlay ? 'shadow-2xl scale-105 rotate-2 cursor-grabbing z-50 ring-2 ring-violet-500/50' : ''}
            `}
        >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user.avatar ? (
                    <img src={user.avatar} className="w-full h-full rounded-full object-cover" />
                ) : (
                    user.nome.charAt(0).toUpperCase()
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-main)] truncate">{user.nome}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">{user.role || 'Membro'}</div>
            </div>
            <GripVertical size={14} className="text-[var(--text-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const BoardColumn = ({ team, members, onEdit, onDelete }: BoardContainerProps) => {
    const memberIds = useMemo(() => members.map(m => m.id), [members]);

    const { setNodeRef } = useSortable({
        id: team ? team.id : 'unassigned',
        data: { type: 'Column', team },
        disabled: true, // Columns themselves are not sortable for now, just drop targets
    });

    return (
        <div ref={setNodeRef} className="flex flex-col w-[280px] shrink-0 h-full max-h-full bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--glass-border)] overflow-hidden">
            {/* Header */}
            <div className={`
                p-4 border-b border-[var(--glass-border)] flex items-center justify-between
                ${team ? 'bg-[var(--bg-card)]' : 'bg-dashed border-dashed border-gray-500/20'}
            `}>
                <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg ${team ? 'bg-violet-500/10 text-violet-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        <UsersIcon size={16} />
                    </span>
                    <h3 className="font-bold text-sm text-[var(--text-main)]">
                        {team ? team.nome : 'Sem Equipe'}
                    </h3>
                    <span className="text-xs font-medium text-[var(--text-dim)] bg-[var(--bg-app)] px-2 py-0.5 rounded-full border border-[var(--glass-border)]">
                        {members.length}
                    </span>
                </div>
                {team && (
                    <div className="flex items-center gap-1">
                        <button onClick={() => onEdit?.(team)} className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-violet-400 hover:bg-[var(--glass-surface)] transition-all">
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete?.(team.id)} className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-rose-400 hover:bg-[var(--glass-surface)] transition-all">
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Member List */}
            <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <SortableContext items={memberIds} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2 min-h-[100px]">
                        {members.map(user => (
                            <MemberCard key={user.id} user={user} />
                        ))}
                        {members.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-dim)] text-xs italic opacity-50 py-10">
                                Arraste membros para cá
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
};

// --- Main Board Component ---

export const OrganogramBoard = () => {
    const queryClient = useQueryClient();
    const addToast = useToastStore(s => s.addToast);
    // const [activeDragId, setActiveDragId] = useState<string | null>(null); // Unused
    const [activeDragUser, setActiveDragUser] = useState<User | null>(null);

    // Queries
    const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
        queryKey: ['teams'],
        queryFn: () => api.get('/teams').then(r => r.data),
    });

    const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data),
    });

    // Mutations
    const moveMemberMutation = useMutation({
        mutationFn: (data: { userId: string, targetTeamId: string | null }) =>
            api.post('/teams/move-member', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            addToast('Membro movido com sucesso!', 'success');
        },
        onError: () => {
            addToast('Erro ao mover membro.', 'error');
        }
    });

    const createTeamMutation = useMutation({
        mutationFn: (nome: string) => api.post('/teams', { nome, admin_id: allUsers[0]?.id }), // fallback admin
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            addToast('Equipe criada!', 'success');
        }
    });

    const deleteTeamMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/teams/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            addToast('Equipe removida.', 'success');
        }
    });

    // Computed State: "Unassigned" vs "Assigned"
    const unassignedUsers = useMemo(() => {
        const assignedIds = new Set<string>();
        teams.forEach(t => t.members.forEach(m => assignedIds.add(m.user_id)));

        return allUsers.filter(u => !assignedIds.has(u.id));
    }, [teams, allUsers]);

    // Dnd Setup
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        // setActiveDragId(active.id as string);
        const user = allUsers.find(u => u.id === active.id);
        if (user) setActiveDragUser(user);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        // setActiveDragId(null);
        setActiveDragUser(null);

        if (!over) return;

        const userId = active.id as string;
        // The over.id could be a "Team ID" (column) or a "User ID" (item in column)

        let targetTeamId: string | null = null;

        // Check if over.id is a column ID
        if (over.id === 'unassigned') targetTeamId = null;
        else if (teams.some(t => t.id === over.id)) targetTeamId = over.id as string;
        else {
            // It's likely a user ID. Find which team column this user is currently in (visually).
            // Fallback: Check checking sorting context? 
            // dnd-kit `closestCorners` usually handles visual placement.

            // Let's look if the `over` user is unassigned
            if (unassignedUsers.some(u => u.id === over.id)) targetTeamId = null;
            else {
                // Find team with this member
                const team = teams.find(t => t.members.some(m => m.user_id === over.id));
                if (team) targetTeamId = team.id;
            }
        }

        // Check "From" where?
        // We don't strictly need to know "From", just "To", because our API wipes previous memberships.

        // Optimistic check: Is user already effectively in that team?
        // (Handled by API, but UI flicker might happen if we don't check)

        moveMemberMutation.mutate({ userId, targetTeamId });
    };

    const handleCreateTeam = () => {
        const name = prompt('Nome da nova equipe:');
        if (name) createTeamMutation.mutate(name);
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: { opacity: '0.4' },
            },
        }),
    };

    if (isLoadingTeams || isLoadingUsers) return <div className="p-10 text-center">Carregando organograma...</div>;

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-[var(--text-muted)]">
                    Arraste os membros entre as colunas para organizar os times.
                </div>
                <button
                    onClick={handleCreateTeam}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-500/20"
                >
                    <Plus size={18} />
                    Nova Equipe
                </button>
            </div>

            {/* Board Area */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start h-full">
                    {/* Unassigned Column */}
                    <BoardColumn
                        team={null}
                        members={unassignedUsers}
                    />

                    {/* Team Columns */}
                    {teams.map(team => (
                        <BoardColumn
                            key={team.id}
                            team={team}
                            members={team.members.map(m => m.user)}
                            onDelete={(id) => {
                                if (confirm('Tem certeza? Os membros ficarão sem equipe.')) deleteTeamMutation.mutate(id);
                            }}
                            onEdit={(t) => {
                                const newName = prompt('Novo nome:', t.nome);
                                if (newName) api.put(`/teams/${t.id}`, { nome: newName }).then(() => queryClient.invalidateQueries({ queryKey: ['teams'] }));
                            }}
                        />
                    ))}
                </div>

                {createPortal(
                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeDragUser ? <MemberCard user={activeDragUser} isOverlay /> : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
};
