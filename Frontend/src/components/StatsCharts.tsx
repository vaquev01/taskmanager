import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Loader2, TrendingUp, PieChart as PieIcon } from 'lucide-react';

export const StatsCharts = () => {
    const { data: weeklyStats, isLoading: loadingWeekly } = useQuery({
        queryKey: ['analytics-weekly'],
        queryFn: () => api.get('/analytics/weekly-completion').then(r => r.data)
    });

    const { data: distribution, isLoading: loadingDist } = useQuery({
        queryKey: ['analytics-distribution'],
        queryFn: () => api.get('/analytics/distribution').then(r => r.data)
    });

    const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

    if (loadingWeekly || loadingDist) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass-card h-72 flex items-center justify-center">
                    <Loader2 className="animate-spin text-violet-400" />
                </div>
                <div className="glass-card h-72 flex items-center justify-center">
                    <Loader2 className="animate-spin text-cyan-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

            {/* Weekly Completion Chart */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-main)]">Produtividade Semanal</h3>
                        <p className="text-xs text-[var(--text-muted)]">Tarefas concluídas nos últimos 7 dias</p>
                    </div>
                </div>
                <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyStats}>
                            <XAxis
                                dataKey="name"
                                stroke="var(--text-dim)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--glass-surface)', borderColor: 'var(--glass-border)', borderRadius: '12px' }}
                                itemStyle={{ color: 'var(--text-main)' }}
                                cursor={{ fill: 'var(--glass-surface-hover)' }}
                            />
                            <Bar
                                dataKey="concluidas"
                                fill="#8b5cf6"
                                radius={[4, 4, 0, 0]}
                                barSize={32}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Chart */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <PieIcon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-[var(--text-main)]">Distribuição por Prioridade</h3>
                        <p className="text-xs text-[var(--text-muted)]">Tarefas ativas por nível de prioridade</p>
                    </div>
                </div>
                <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={distribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {distribution?.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.1)" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--glass-surface)', borderColor: 'var(--glass-border)', borderRadius: '12px' }}
                                itemStyle={{ color: 'var(--text-main)' }}
                            />
                            <Legend
                                verticalAlign="middle"
                                align="right"
                                layout="vertical"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
