import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Clock, Bell, Trash2, Save, Sparkles, Wifi, WifiOff } from 'lucide-react';
import api from '../lib/api';

interface Reminder {
    id: string;
    task: { titulo: string; prazo: string };
    horario: string;
}

export function SettingsPage() {
    const { user } = useStore();
    const [timezone, setTimezone] = useState('America/Sao_Paulo');
    const [dailySummaryTime, setDailySummaryTime] = useState('');
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [whatsappStatus, setWhatsappStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setTimezone(user.timezone || 'America/Sao_Paulo');
            setDailySummaryTime(user.dailySummaryTime || '');
            fetchReminders();
        }
        checkWhatsappStatus();
    }, [user]);

    const fetchReminders = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/reminders?userId=${user.id}`);
            setReminders(res.data);
        } catch (e) {
            console.error('Failed to fetch reminders');
        }
    };

    const checkWhatsappStatus = async () => {
        try {
            await api.get('/whatsapp/status');
            setWhatsappStatus('connected');
        } catch (error) {
            setWhatsappStatus('disconnected');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await api.put(`/users/${user.id}`, {
                timezone,
                dailySummaryTime
            });
            alert('Configurações salvas!');
        } catch (e) {
            alert('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteReminder = async (id: string) => {
        if (!confirm('Excluir este lembrete?')) return;
        try {
            await api.delete(`/reminders/${id}`);
            setReminders(reminders.filter(r => r.id !== id));
        } catch (e) {
            alert('Erro ao excluir lembrete');
        }
    };

    return (
        <div className="p-6 md:p-10 lg:p-12 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-10 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[var(--text-muted)] font-medium text-sm uppercase tracking-wider">Preferências</span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center gap-1">
                        <Sparkles size={10} /> PRO
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                    <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Configurações</span>
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {/* General Settings */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Clock size={16} />
                        </div>
                        Preferências de Horário
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Fuso Horário</label>
                            <select
                                value={timezone}
                                onChange={e => setTimezone(e.target.value)}
                                className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="America/Sao_Paulo">Brasília (America/Sao_Paulo)</option>
                                <option value="America/New_York">New York (EST)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="Europe/Lisbon">Lisbon (WET)</option>
                            </select>
                            <p className="text-xs text-[var(--text-dim)] mt-1.5">Define como o bot interpreta "hoje", "amanhã", etc.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Horário do Resumo Diário</label>
                            <input
                                type="time"
                                value={dailySummaryTime}
                                onChange={e => setDailySummaryTime(e.target.value)}
                                className="w-full bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-violet-500/50 transition-colors"
                            />
                            <p className="text-xs text-[var(--text-dim)] mt-1.5">Horário para receber a lista de tarefas do dia seguinte.</p>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg shadow-violet-500/20"
                            >
                                <Save size={16} />
                                {saving ? 'Salvando...' : 'Salvar Preferências'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Integration Status */}
                <div className="glass-card p-6 h-fit">
                    <h2 className="text-lg font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Wifi size={16} />
                        </div>
                        Status do Sistema
                    </h2>
                    <div className="flex items-center justify-between p-4 bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)]">
                        <span className="font-medium text-[var(--text-secondary)]">WhatsApp Bot</span>
                        <div className="flex items-center gap-2">
                            {whatsappStatus === 'checking' && <span className="text-[var(--text-dim)] text-sm">Verificando...</span>}
                            {whatsappStatus === 'connected' && (
                                <>
                                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-green-400 font-semibold text-sm">Online</span>
                                </>
                            )}
                            {whatsappStatus === 'disconnected' && (
                                <>
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                                    <span className="text-rose-400 font-semibold text-sm">Offline</span>
                                </>
                            )}
                        </div>
                    </div>
                    {whatsappStatus === 'disconnected' && (
                        <div className="mt-4 p-4 bg-rose-500/10 text-rose-300 text-sm rounded-xl border border-rose-500/20 flex items-center gap-2">
                            <WifiOff size={14} />
                            O bot está offline. Verifique o backend ou escaneie o QR Code novamente.
                        </div>
                    )}
                </div>

                {/* Reminders Dashboard */}
                <div className="glass-card p-6 col-span-1 md:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="text-lg font-bold text-[var(--text-main)] mb-6 flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Bell size={16} />
                        </div>
                        Lembretes Agendados
                    </h2>

                    {reminders.length === 0 ? (
                        <div className="text-center py-10 text-[var(--text-dim)] bg-[var(--glass-surface)] rounded-xl border border-[var(--glass-border)]">
                            <Bell size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Nenhum lembrete pendente.</p>
                            <p className="text-xs mt-1">Use o WhatsApp para criar lembretes naturalmente.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reminders.map(reminder => (
                                <div key={reminder.id} className="flex items-center justify-between p-4 bg-[var(--glass-surface)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] transition-all rounded-xl group">
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-main)]">{reminder.task.titulo}</h3>
                                        <div className="text-sm text-[var(--text-muted)] flex gap-4 mt-1">
                                            <span>🔔 {new Date(reminder.horario).toLocaleString()}</span>
                                            <span>📅 {reminder.task.prazo ? new Date(reminder.task.prazo).toLocaleDateString() : 'Sem prazo'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReminder(reminder.id)}
                                        className="p-2 text-[var(--text-dim)] hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                                        title="Cancelar Lembrete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
