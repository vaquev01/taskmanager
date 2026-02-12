import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import api from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, ListTodo, Shield, LayoutDashboard, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard = () => {
    const { user, isAuthenticated } = useStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
            navigate('/dashboard');
            return;
        }

        api.get('/admin/stats')
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));

    }, [isAuthenticated, user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Shield className="w-8 h-8 text-purple-500" />
                            Painel Master <span className="text-sm bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30">SUPER_ADMIN</span>
                        </h1>
                        <p className="text-slate-400">Visão global do sistema TaskFlow.</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5" /> Ir para App
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        title="Usuários Totais"
                        value={stats?.users || 0}
                        icon={<Users className="w-6 h-6 text-blue-400" />}
                        color="bg-blue-500/10 border-blue-500/20"
                    />
                    <StatCard
                        title="Tarefas Ativas"
                        value={stats?.tasks?.active || 0}
                        icon={<ListTodo className="w-6 h-6 text-yellow-400" />}
                        color="bg-yellow-500/10 border-yellow-500/20"
                    />
                    <StatCard
                        title="Tarefas Concluídas"
                        value={(stats?.tasks?.total || 0) - (stats?.tasks?.active || 0)}
                        icon={<CheckCircle className="w-6 h-6 text-green-400" />}
                        color="bg-green-500/10 border-green-500/20"
                    />
                    <StatCard
                        title="Database Nodes"
                        value="3"
                        icon={<Database className="w-6 h-6 text-red-400" />}
                        color="bg-red-500/10 border-red-500/20"
                    />
                </div>

                {/* Simulated Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-6">Crescimento de Usuários</h3>
                        <div className="h-64 flex items-end gap-2 justify-between px-4 pb-4 border-b border-slate-800">
                            {[40, 65, 45, 80, 55, 90, 100].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="w-full bg-gradient-to-t from-cyan-900/50 to-cyan-500/50 rounded-t-sm relative group hover:to-cyan-400"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs px-2 py-1 rounded">
                                        {h * 12}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                            <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-6">Receita Recorrente (MRR)</h3>
                        <div className="flex items-center justify-center h-64 flex-col">
                            <h4 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">
                                R$ 12.450,00
                            </h4>
                            <p className="text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full text-sm">
                                +12.5% este mês
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }: any) => (
    <div className={`p-6 rounded-2xl border backdrop-blur-sm ${color} transition-all hover:scale-[1.02]`}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-slate-950/30`}>
                {icon}
            </div>
        </div>
    </div>
);
