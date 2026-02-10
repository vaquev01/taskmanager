import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { User, Clock, Bell, Trash2, Save } from 'lucide-react';
import axios from 'axios';

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
            const res = await axios.get(`http://localhost:4000/api/reminders?userId=${user.id}`);
            setReminders(res.data);
        } catch (e) {
            console.error('Failed to fetch reminders');
        }
    };

    const checkWhatsappStatus = async () => {
        try {
            await axios.get('http://localhost:4000/api/whatsapp/status');
            setWhatsappStatus('connected');
        } catch (error) {
            setWhatsappStatus('disconnected');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await axios.put(`http://localhost:4000/api/users/${user.id}`, {
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
            await axios.delete(`http://localhost:4000/api/reminders/${id}`);
            setReminders(reminders.filter(r => r.id !== id));
        } catch (e) {
            alert('Erro ao excluir rembrete');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                Configurações & Preferências
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        Preferências de Horário
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fuso Horário</label>
                            <select
                                value={timezone}
                                onChange={e => setTimezone(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="America/Sao_Paulo">Brasília (America/Sao_Paulo)</option>
                                <option value="America/New_York">New York (EST)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="Europe/Lisbon">Lisbon (WET)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Define como o bot interpreta "hoje", "amanhã", etc.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Horário do Resumo Diário</label>
                            <input
                                type="time"
                                value={dailySummaryTime}
                                onChange={e => setDailySummaryTime(e.target.value)}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">Horário para receber a lista de tarefas do dia seguinte.</p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Salvando...' : 'Salvar Preferências'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Integration Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-xl font-semibold mb-6">Status do Sistema</h2>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">WhatsApp Bot</span>
                        <div className="flex items-center gap-2">
                            {whatsappStatus === 'checking' && <span className="text-gray-500">Verificando...</span>}
                            {whatsappStatus === 'connected' && (
                                <>
                                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-green-700 font-medium">Online</span>
                                </>
                            )}
                            {whatsappStatus === 'disconnected' && (
                                <>
                                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                    <span className="text-red-700 font-medium">Offline</span>
                                </>
                            )}
                        </div>
                    </div>
                    {whatsappStatus === 'disconnected' && (
                        <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-lg">
                            O bot parece estar offline. Verifique o terminal do backend ou escaneie o QR Code novamente.
                        </div>
                    )}
                </div>

                {/* Reminders Dashboard */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-orange-500" />
                        Lembretes Agendados
                    </h2>

                    {reminders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            Nenhum lembrete pendente.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reminders.map(reminder => (
                                <div key={reminder.id} className="flex items-center justify-between p-4 bg-white border hover:shadow-md transition rounded-lg group">
                                    <div>
                                        <h3 className="font-medium text-gray-800">{reminder.task.titulo}</h3>
                                        <div className="text-sm text-gray-500 flex gap-4 mt-1">
                                            <span>🔔 Lembrete: {new Date(reminder.horario).toLocaleString()}</span>
                                            <span>📅 Prazo: {reminder.task.prazo ? new Date(reminder.task.prazo).toLocaleDateString() : 'Sem prazo'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReminder(reminder.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                                        title="Cancelar Lembrete"
                                    >
                                        <Trash2 className="w-5 h-5" />
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
