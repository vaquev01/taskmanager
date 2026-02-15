import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../lib/api';
import { Zap, Sparkles, Loader2, Lock, User, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { setUser } = useStore();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', { identifier, password });
            setUser(data.user, data.token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-app)] relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-400 mb-6 shadow-2xl shadow-violet-500/30">
                        <Zap size={32} fill="white" strokeWidth={0} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                        Task<span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Flow</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="text-violet-400" />
                        Ambiente Seguro
                    </p>
                </div>

                <form onSubmit={handleLogin} className="glass-card p-8 space-y-6">
                    <div className="text-center mb-2">
                        <h2 className="text-xl font-bold text-[var(--text-main)]">Bem-vindo de volta</h2>
                        <p className="text-sm text-[var(--text-muted)]">Entre com suas credenciais</p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Email ou WhatsApp</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18} />
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none text-[var(--text-main)] placeholder:text-[var(--text-dim)] transition-all"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-[var(--glass-border)] rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none text-[var(--text-main)] placeholder:text-[var(--text-dim)] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-3 text-base justify-center shadow-lg shadow-violet-500/20"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
                    </button>

                    <p className="text-center text-xs text-[var(--text-dim)] mt-6">
                        Esqueceu sua senha? Contate o administrador.
                    </p>
                </form>

                {/* Footer */}
                <p className="text-center text-xs text-[var(--text-dim)] mt-10 opacity-50">
                    TaskFlow v2.0 · Security Update
                </p>
            </div>
        </div>
    );
};
