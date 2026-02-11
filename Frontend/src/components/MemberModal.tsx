import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToastStore } from '../store/useToastStore';
import { X, User, Mail, Phone, Globe, Loader2, Save, Trash2 } from 'lucide-react';
import type { User as UserType } from '../types';

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member?: UserType | null; // If provided, we are editing
}

export const MemberModal = ({ isOpen, onClose, member }: MemberModalProps) => {
    const addToast = useToastStore(s => s.addToast);
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        nome: '',
        email: '',
        telefone_whatsapp: '',
        role: 'MEMBER', // Future proofing
        timezone: 'America/Sao_Paulo',
        avatar: ''
    });

    useEffect(() => {
        if (member) {
            setForm({
                nome: member.nome,
                email: (member as any).email || '', // Type casting in case optional
                telefone_whatsapp: member.whatsapp || (member as any).telefone_whatsapp || '', // Handle varied naming in types vs backend
                role: 'MEMBER',
                timezone: member.timezone || 'America/Sao_Paulo',
                avatar: (member as any).avatar || ''
            });
        } else {
            setForm({
                nome: '',
                email: '',
                telefone_whatsapp: '',
                role: 'MEMBER',
                timezone: 'America/Sao_Paulo',
                avatar: ''
            });
        }
    }, [member, isOpen]);

    const createMutation = useMutation({
        mutationFn: (data: typeof form) => api.post('/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addToast('Membro adicionado com sucesso!', 'success');
            onClose();
        },
        onError: (err: any) => {
            addToast(err.response?.data?.error || 'Erro ao adicionar membro', 'error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: typeof form) => api.put(`/users/${member?.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addToast('Membro atualizado com sucesso!', 'success');
            onClose();
        },
        onError: (err: any) => {
            addToast(err.response?.data?.error || 'Erro ao atualizar membro', 'error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: () => api.delete(`/users/${member?.id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            addToast('Membro removido com sucesso!', 'success');
            onClose();
        },
        onError: (err: any) => {
            addToast(err.response?.data?.error || 'Erro ao remover membro', 'error');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (member) {
            updateMutation.mutate(form);
        } else {
            createMutation.mutate(form);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--glass-surface)] border border-[var(--glass-border)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-main)]">
                        {member ? <User className="text-violet-400" /> : <User className="text-cyan-400" />}
                        {member ? 'Editar Membro' : 'Novo Membro'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-[var(--text-muted)] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="member-form" onSubmit={handleSubmit} className="space-y-4">

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={form.nome}
                                    onChange={e => setForm({ ...form, nome: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none text-[var(--text-main)] placeholder:text-[var(--text-dim)]"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">WhatsApp (com DDD)</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={form.telefone_whatsapp}
                                    onChange={e => setForm({ ...form, telefone_whatsapp: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none text-[var(--text-main)] placeholder:text-[var(--text-dim)]"
                                    placeholder="Ex: 5511999999999"
                                />
                            </div>
                            <p className="text-xs text-[var(--text-dim)]">Formato internacional: 55 + DDD + Número</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Email (Opcional)</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18} />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none text-[var(--text-main)] placeholder:text-[var(--text-dim)]"
                                    placeholder="joao@exemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Fuso Horário</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18} />
                                <select
                                    value={form.timezone}
                                    onChange={e => setForm({ ...form, timezone: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none text-[var(--text-main)] appearance-none cursor-pointer"
                                >
                                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                                    <option value="Europe/Lisbon">Lisboa (GMT+0)</option>
                                    <option value="America/New_York">Nova York (GMT-5)</option>
                                    <option value="UTC">UTC (GMT+0)</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--glass-border)] bg-black/20 flex items-center justify-between gap-3">
                    {member ? (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm('Tem certeza que deseja remover este membro?')) {
                                    deleteMutation.mutate();
                                }
                            }}
                            className="btn bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-rose-500/20"
                        >
                            <Trash2 size={18} />
                            <span className="hidden sm:inline">Remover</span>
                        </button>
                    ) : (
                        <div /> // Spacer
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="member-form"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="btn btn-primary px-6"
                        >
                            {createMutation.isPending || updateMutation.isPending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            <span>{member ? 'Salvar' : 'Criar'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
