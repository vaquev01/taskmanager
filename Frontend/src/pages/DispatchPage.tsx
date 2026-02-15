import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useToastStore } from '../store/useToastStore';
import {
    Send, Filter, Users, CheckSquare, AlertTriangle,
    Sparkles, Loader2, Eye, ChevronDown, ChevronUp,
    ListChecks, FolderKanban, Target
} from 'lucide-react';

interface Filters {
    userIds: string[];
    teamIds: string[];
    taskStatuses: string[];
    grupos: string[];
    priorities: string[];
}

interface Recipient {
    userId: string;
    phone: string;
    name: string;
    taskTitles: string[];
}

export const DispatchPage = () => {
    const addToast = useToastStore(s => s.addToast);

    const [filters, setFilters] = useState<Filters>({
        userIds: [],
        teamIds: [],
        taskStatuses: [],
        grupos: [],
        priorities: [],
    });

    const [template, setTemplate] = useState(
        '📋 Olá {nome}!\n\nVocê tem {total} tarefa(s) pendente(s):\n▫️ {tarefas}\n\n💪 Bora finalizar!'
    );

    const [showFilters, setShowFilters] = useState(true);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isSending, setIsSending] = useState(false);
    const [sendResults, setSendResults] = useState<any>(null);

    // Load filter options
    const { data: filterOptions, isLoading: filtersLoading } = useQuery({
        queryKey: ['dispatch-filters'],
        queryFn: () => api.get('/dispatch/filters').then(r => r.data),
    });

    // Preview mutation
    const previewMutation = useMutation({
        mutationFn: (data: Filters) => api.post('/dispatch/preview', data).then(r => r.data),
        onSuccess: (data) => {
            setPreviewData(data);
            addToast(`${data.meta.totalUsers} usuários, ${data.meta.totalTasks} tarefas encontradas`, 'success');
        },
        onError: () => addToast('Erro ao gerar preview', 'error'),
    });

    // Build recipients from preview data
    const buildRecipients = (): Recipient[] => {
        if (!previewData) return [];

        const recipientMap = new Map<string, Recipient>();

        for (const user of previewData.users) {
            recipientMap.set(user.id, {
                userId: user.id,
                phone: user.telefone_whatsapp,
                name: user.nome,
                taskTitles: [],
            });
        }

        for (const task of previewData.tasks) {
            const userId = task.responsavel?.id || task.criador?.id;
            if (userId && recipientMap.has(userId)) {
                recipientMap.get(userId)!.taskTitles.push(task.titulo);
            }
        }

        return Array.from(recipientMap.values());
    };

    // Send mutation
    const handleSend = async () => {
        const recipients = buildRecipients();
        if (recipients.length === 0) {
            addToast('Nenhum destinatário selecionado', 'error');
            return;
        }

        if (!confirm(`Enviar mensagem para ${recipients.length} pessoa(s)?`)) return;

        setIsSending(true);
        setSendResults(null);

        try {
            const res = await api.post('/dispatch/send', { recipients, template });
            setSendResults(res.data);
            addToast(`✅ ${res.data.sent} mensagem(ns) enviada(s)!`, 'success');
        } catch (err: any) {
            addToast(err.response?.data?.error || 'Erro ao enviar', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const toggleFilter = (key: keyof Filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(v => v !== value)
                : [...prev[key], value]
        }));
    };

    const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <div className="p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto pb-32">
            {/* Header */}
            <div className="mb-10 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Comunicação Direta</span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles size={10} /> PRO
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                    <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Disparos</span>
                </h1>
                <p className="text-[var(--text-muted)] mt-2 text-sm">Envie mensagens pelo WhatsApp para usuários filtrados por equipe, status, prioridade e mais.</p>
            </div>

            <div className="flex flex-col xl:flex-row gap-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {/* Left: Filters + Template */}
                <div className="flex-1 space-y-6">
                    {/* Filter Section */}
                    <div className="glass-card overflow-hidden">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                    <Filter size={18} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-[var(--text-main)]">Filtros</h3>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {activeFilterCount > 0 ? `${activeFilterCount} filtro(s) ativos` : 'Nenhum filtro selecionado (todos os usuários)'}
                                    </p>
                                </div>
                            </div>
                            {showFilters ? <ChevronUp size={18} className="text-[var(--text-muted)]" /> : <ChevronDown size={18} className="text-[var(--text-muted)]" />}
                        </button>

                        {showFilters && (
                            <div className="p-5 pt-0 space-y-5 border-t border-[var(--glass-border)]">
                                {filtersLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 size={24} className="animate-spin text-violet-400" />
                                    </div>
                                ) : (
                                    <>
                                        {/* By Team */}
                                        <FilterSection
                                            icon={<Users size={16} />}
                                            title="Por Equipe"
                                            items={filterOptions?.teams?.map((t: any) => ({ id: t.id, label: `${t.nome} (${t.memberCount})` })) || []}
                                            selected={filters.teamIds}
                                            onToggle={(id) => toggleFilter('teamIds', id)}
                                        />

                                        {/* By User */}
                                        <FilterSection
                                            icon={<Target size={16} />}
                                            title="Por Nome"
                                            items={filterOptions?.users?.map((u: any) => ({ id: u.id, label: u.nome })) || []}
                                            selected={filters.userIds}
                                            onToggle={(id) => toggleFilter('userIds', id)}
                                        />

                                        {/* By Status */}
                                        <FilterSection
                                            icon={<CheckSquare size={16} />}
                                            title="Por Status"
                                            items={(filterOptions?.statuses || []).map((s: string) => ({ id: s, label: statusLabel(s) }))}
                                            selected={filters.taskStatuses}
                                            onToggle={(id) => toggleFilter('taskStatuses', id)}
                                        />

                                        {/* By Priority */}
                                        <FilterSection
                                            icon={<AlertTriangle size={16} />}
                                            title="Por Prioridade"
                                            items={(filterOptions?.priorities || []).map((p: string) => ({ id: p, label: p }))}
                                            selected={filters.priorities}
                                            onToggle={(id) => toggleFilter('priorities', id)}
                                        />

                                        {/* By Group */}
                                        {(filterOptions?.grupos?.length > 0) && (
                                            <FilterSection
                                                icon={<FolderKanban size={16} />}
                                                title="Por Grupo"
                                                items={(filterOptions?.grupos || []).map((g: string) => ({ id: g, label: g }))}
                                                selected={filters.grupos}
                                                onToggle={(id) => toggleFilter('grupos', id)}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Message Template */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <ListChecks size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--text-main)]">Template da Mensagem</h3>
                                <p className="text-xs text-[var(--text-muted)]">Use variáveis: {'{nome}'}, {'{tarefas}'}, {'{total}'}</p>
                            </div>
                        </div>
                        <textarea
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            rows={6}
                            className="w-full bg-black/20 border border-[var(--glass-border)] rounded-xl p-4 text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none resize-none font-mono"
                            placeholder="Escreva sua mensagem aqui..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => previewMutation.mutate(filters)}
                            disabled={previewMutation.isPending}
                            className="btn bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 flex-1"
                        >
                            {previewMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                            <span>Preview</span>
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!previewData || isSending}
                            className="btn btn-primary flex-1 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            <span>Enviar Disparo</span>
                        </button>
                    </div>
                </div>

                {/* Right: Preview Panel */}
                <div className="w-full xl:w-[380px] shrink-0 space-y-6">
                    {/* Preview Results */}
                    <div className="glass-card p-5 sticky top-6">
                        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                            <Eye size={18} className="text-violet-400" />
                            Preview do Envio
                        </h3>

                        {!previewData ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                                    <Filter size={24} className="text-violet-400" />
                                </div>
                                <p className="text-sm text-[var(--text-muted)]">Selecione filtros e clique em <strong>Preview</strong> para ver os destinatários.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                                        <div className="text-2xl font-bold text-violet-400">{previewData.meta.totalUsers}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Destinatários</div>
                                    </div>
                                    <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                                        <div className="text-2xl font-bold text-cyan-400">{previewData.meta.totalTasks}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Tarefas</div>
                                    </div>
                                </div>

                                {/* Recipients List */}
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                                    {buildRecipients().map((r) => (
                                        <div key={r.userId} className="p-3 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm text-[var(--text-main)]">{r.name}</span>
                                                <span className="text-[10px] text-[var(--text-dim)] font-mono">{r.phone}</span>
                                            </div>
                                            {r.taskTitles.length > 0 && (
                                                <div className="text-xs text-[var(--text-muted)] mt-1">
                                                    {r.taskTitles.slice(0, 3).map((t, i) => (
                                                        <div key={i}>▫️ {t}</div>
                                                    ))}
                                                    {r.taskTitles.length > 3 && (
                                                        <div className="text-[var(--text-dim)]">+{r.taskTitles.length - 3} mais...</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Message Preview */}
                                <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Mensagem Preview</h4>
                                    <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-sans">
                                        {template.replace(/\{nome\}/g, 'João').replace(/\{tarefas\}/g, 'Tarefa exemplo').replace(/\{total\}/g, '3')}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Send Results */}
                        {sendResults && (
                            <div className="mt-4 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Resultado do Envio</h4>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-emerald-400 font-bold">✅ {sendResults.sent} enviadas</span>
                                    {sendResults.errors > 0 && (
                                        <span className="text-rose-400 font-bold">❌ {sendResults.errors} erros</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const FilterSection = ({ icon, title, items, selected, onToggle }: {
    icon: React.ReactNode;
    title: string;
    items: { id: string; label: string }[];
    selected: string[];
    onToggle: (id: string) => void;
}) => (
    <div className="pt-4">
        <div className="flex items-center gap-2 mb-3">
            <span className="text-violet-400">{icon}</span>
            <h4 className="text-sm font-semibold text-[var(--text-secondary)]">{title}</h4>
            {selected.length > 0 && (
                <span className="text-[10px] font-bold bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">{selected.length}</span>
            )}
        </div>
        <div className="flex flex-wrap gap-2">
            {items.map(item => {
                const isActive = selected.includes(item.id);
                return (
                    <button
                        key={item.id}
                        onClick={() => onToggle(item.id)}
                        className={`
                            px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                            ${isActive
                                ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                                : 'bg-black/20 text-[var(--text-muted)] border-[var(--glass-border)] hover:border-violet-500/20 hover:text-[var(--text-secondary)]'
                            }
                        `}
                    >
                        {isActive && <span className="mr-1">✓</span>}
                        {item.label}
                    </button>
                );
            })}
            {items.length === 0 && (
                <span className="text-xs text-[var(--text-dim)] italic">Nenhum disponível</span>
            )}
        </div>
    </div>
);

const statusLabel = (s: string) => {
    const labels: Record<string, string> = {
        'PENDENTE': '⏳ Pendente',
        'EM_PROGRESSO': '🔄 Em Progresso',
        'CONCLUIDA': '✅ Concluída',
    };
    return labels[s] || s;
};
