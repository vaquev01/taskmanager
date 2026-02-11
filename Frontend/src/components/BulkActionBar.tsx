import { X, CheckCircle2, Trash2, ArrowUpCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToastStore } from '../store/useToastStore';

interface BulkActionBarProps {
    selectedIds: string[];
    onClearSelection: () => void;
}

export const BulkActionBar = ({ selectedIds, onClearSelection }: BulkActionBarProps) => {
    const queryClient = useQueryClient();
    const addToast = useToastStore(s => s.addToast);

    const bulkMutation = useMutation({
        mutationFn: (updates: any) => api.post('/tasks/bulk', { taskIds: selectedIds, updates }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            addToast(`${selectedIds.length} tarefas atualizadas!`, 'success');
            onClearSelection();
        },
        onError: () => addToast('Erro ao atualizar tarefas', 'error')
    });

    if (selectedIds.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
            <div className="bg-gray-900/90 backdrop-blur-md text-[var(--text-main)] px-6 py-4 rounded-full shadow-2xl border border-gray-700 flex items-center gap-6">
                <div className="flex items-center gap-3 border-r border-gray-700 pr-6">
                    <span className="bg-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{selectedIds.length}</span>
                    <span className="font-medium text-sm">Selecionados</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => bulkMutation.mutate({ status: 'CONCLUIDA' })}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-emerald-400"
                        title="Concluir Todos"
                    >
                        <CheckCircle2 size={20} />
                    </button>

                    <button
                        onClick={() => bulkMutation.mutate({ status: 'PENDENTE' })}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-yellow-400"
                        title="Reabrir Todos"
                    >
                        <ArrowUpCircle size={20} />
                    </button>

                    <div className="h-6 w-px bg-gray-700 mx-1" />

                    <button
                        onClick={() => bulkMutation.mutate({ prazo: new Date().toISOString() })}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-blue-400"
                        title="Mover para Hoje"
                    >
                        <span className="font-bold text-xs">Hoje</span>
                    </button>

                    <button
                        onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            bulkMutation.mutate({ prazo: tomorrow.toISOString() });
                        }}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-purple-400"
                        title="Mover para Amanhã"
                    >
                        <span className="font-bold text-xs">Amanhã</span>
                    </button>

                    <div className="h-6 w-px bg-gray-700 mx-1" />

                    <button
                        onClick={() => {
                            if (confirm(`Excluir ${selectedIds.length} tarefas?`)) {
                                Promise.all(selectedIds.map(id => api.delete(`/tasks/${id}`)))
                                    .then(() => {
                                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                                        onClearSelection();
                                    });
                            }
                        }}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors text-red-400"
                        title="Excluir Todos"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                <button
                    onClick={onClearSelection}
                    className="ml-4 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={16} className="text-gray-400" />
                </button>
            </div>
        </div>
    );
}
