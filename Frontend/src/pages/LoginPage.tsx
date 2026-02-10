import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import type { User } from '../store/useStore';
import api from '../lib/api';
import { Zap, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { setUser, isAuthenticated } = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) { navigate('/'); return; }
        api.get('/users')
            .then(res => setUsers(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleLogin = (user: User) => {
        setSelectedId(user.id);
        setTimeout(() => {
            setUser(user);
            navigate('/');
        }, 400);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                {/* Logo */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-400 mb-6 shadow-2xl shadow-violet-500/30">
                        <Zap size={32} fill="white" strokeWidth={0} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                        Task<span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Flow</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="text-violet-400" />
                        Selecione seu perfil para continuar
                    </p>
                </div>

                {/* User Cards */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-violet-400" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-[var(--text-muted)] mb-2">Nenhum usuário encontrado.</p>
                        <p className="text-sm text-[var(--text-dim)]">Execute o seed do banco de dados primeiro.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => handleLogin(user)}
                                disabled={selectedId !== null}
                                className={`
                                    group w-full p-5 rounded-2xl border transition-all duration-300 text-left
                                    flex items-center gap-4
                                    ${selectedId === user.id
                                        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/10 border-violet-500/40 scale-[0.98]'
                                        : 'bg-[var(--glass-surface)] border-[var(--glass-border)] hover:border-violet-500/30 hover:bg-[var(--glass-surface-hover)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5'
                                    }
                                `}
                            >
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-lg font-bold text-white shadow-lg overflow-hidden shrink-0">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
                                    ) : (
                                        user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white text-lg truncate">{user.nome}</div>
                                    <div className="text-sm text-[var(--text-muted)] truncate">{user.email || user.telefone_whatsapp}</div>
                                </div>
                                <ArrowRight size={20} className={`
                                    text-[var(--text-dim)] transition-all
                                    ${selectedId === user.id ? 'text-violet-400 translate-x-1' : 'group-hover:text-violet-400 group-hover:translate-x-1'}
                                `} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-[var(--text-dim)] mt-10">
                    TaskFlow v1.0 · Task Management + WhatsApp Integration
                </p>
            </div>
        </div>
    );
};
