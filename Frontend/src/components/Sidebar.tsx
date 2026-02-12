import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { LayoutDashboard, Calendar, Users, Settings, Zap, X, Sparkles, LogOut, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
    const { user, logout, theme, toggleTheme } = useStore();
    const navigate = useNavigate();

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data),
    });

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed md:relative z-50
                w-[280px] h-full
                bg-[var(--bg-sidebar)]/95 backdrop-blur-xl
                border-r border-[var(--glass-border)]
                flex flex-col transition-transform duration-300 ease-out
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:shadow-none'} 
            `}>
                {/* Logo */}
                <div className="flex items-center justify-between p-6 pb-8">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                                <Zap size={20} fill="currentColor" strokeWidth={0} />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[var(--bg-sidebar)] animate-pulse" />
                        </div>
                        <div>
                            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">TaskFlow</span>
                            <div className="text-[10px] font-medium text-violet-400 -mt-0.5 flex items-center gap-1">
                                <Sparkles size={10} /> PRO
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-surface)] transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1 px-4 flex-1">
                    <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-[0.15em] mb-3 px-3">Navigation</div>

                    <SidebarLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={onClose} />
                    <SidebarLink to="/dashboard/calendar" icon={<Calendar size={18} />} label="Calendar" onClick={onClose} />
                    <SidebarLink to="/dashboard/team" icon={<Users size={18} />} label="Team" badge={users?.length ? String(users.length) : undefined} onClick={onClose} />
                    <SidebarLink to="/dashboard/settings" icon={<Settings size={18} />} label="Settings" onClick={onClose} />
                </nav>

                {/* User Profile */}
                <div className="p-4 m-4 mt-auto rounded-2xl bg-gradient-to-br from-[var(--glass-surface)] to-transparent border border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-lg overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.nome} className="w-full h-full object-cover" />
                                ) : (
                                    user?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[var(--bg-sidebar)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[var(--text-main)] truncate">{user?.nome || 'Usuário'}</div>
                            <div className="text-xs text-violet-400 font-medium">Pro Plan</div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-[var(--text-dim)] hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-[var(--text-dim)] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Sair"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

const SidebarLink = ({ to, icon, label, badge, onClick }: { to: string, icon: any, label: string, badge?: string, onClick?: () => void }) => (
    <NavLink
        to={to}
        end={to === '/'}
        onClick={onClick}
        className={({ isActive }) => `
            nav-item group relative
            ${isActive ? 'active' : ''}
        `}
    >
        {({ isActive }) => (
            <>
                <span className={`transition-colors ${isActive ? 'text-violet-400' : 'text-[var(--text-muted)] group-hover:text-violet-400'}`}>
                    {icon}
                </span>
                <span className="font-medium">{label}</span>
                {badge && (
                    <span className="ml-auto text-[10px] font-bold bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
            </>
        )}
    </NavLink>
);
