import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../lib/api';
import {
    Search, Calendar, LayoutDashboard, Users, FileText,
    LogOut, Moon, Sun, Plus, CheckCircle2, User as UserIcon, Loader2
} from 'lucide-react';

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ tasks: any[], users: any[] }>({ tasks: [], users: [] });

    const navigate = useNavigate();
    const { toggleTheme, theme, logout } = useStore();

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Debounced Search
    useEffect(() => {
        if (query.length < 2) {
            setResults({ tasks: [], users: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/search?q=${query}`);
                setResults(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Navigation Helper
    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Search"
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm animate-fade-in"
        >
            <div className="w-full max-w-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-xl shadow-2xl overflow-hidden glass-card">
                <div className="flex items-center border-b border-[var(--glass-border)] px-4" cmdk-input-wrapper="">
                    <Search className="w-5 h-5 text-[var(--text-dim)] mr-2" />
                    <Command.Input
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Pesquisar tarefas, usuários ou comandos..."
                        className="w-full bg-transparent py-4 text-lg outline-none text-[var(--text-main)] placeholder:text-[var(--text-dim)]"
                    />
                    {loading && <Loader2 className="animate-spin text-violet-400" size={18} />}
                </div>

                <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                    <Command.Empty className="py-6 text-center text-[var(--text-muted)]">
                        Nenhum resultado encontrado.
                    </Command.Empty>

                    {/* Navigation Group */}
                    <Command.Group heading="Navegação" className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2 px-2">
                        <Command.Item onSelect={() => runCommand(() => navigate('/dashboard'))} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] aria-selected:bg-violet-500/20 aria-selected:text-violet-300 cursor-pointer transition-colors">
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/calendar'))} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] aria-selected:bg-violet-500/20 aria-selected:text-violet-300 cursor-pointer transition-colors">
                            <Calendar size={18} />
                            Calendário
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => navigate('/team'))} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] aria-selected:bg-violet-500/20 aria-selected:text-violet-300 cursor-pointer transition-colors">
                            <Users size={18} />
                            Equipe
                        </Command.Item>
                    </Command.Group>

                    {/* Actions Group */}
                    <Command.Group heading="Ações" className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2 px-2 mt-4 ml-0">
                        <Command.Item onSelect={() => runCommand(() => toggleTheme())} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] aria-selected:bg-violet-500/20 aria-selected:text-violet-300 cursor-pointer transition-colors">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            Alternar Tema
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => logout())} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-rose-400 aria-selected:bg-rose-500/20 cursor-pointer transition-colors">
                            <LogOut size={18} />
                            Sair
                        </Command.Item>
                    </Command.Group>

                    {/* Tasks Results */}
                    {results.tasks.length > 0 && (
                        <Command.Group heading="Tarefas" className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2 px-2 mt-4 ml-0">
                            {results.tasks.map((task) => (
                                <Command.Item
                                    key={task.id}
                                    onSelect={() => runCommand(() => navigate(`/dashboard?taskId=${task.id}`))}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] aria-selected:bg-violet-500/20 aria-selected:text-violet-300 cursor-pointer transition-colors"
                                >
                                    <CheckCircle2 size={18} className={task.status === 'CONCLUIDA' ? 'text-green-400' : 'text-orange-400'} />
                                    <span>{task.titulo}</span>
                                    <span className="ml-auto text-xs opacity-50">{task.status}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    {/* Users Results */}
                    {results.users.length > 0 && (
                        <Command.Group heading="Usuários" className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2 px-2 mt-4 ml-0">
                            {results.users.map((user) => (
                                <Command.Item
                                    key={user.id}
                                    onSelect={() => runCommand(() => navigate(`/team`))} // Ideally go to user profile
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] aria-selected:bg-violet-500/20 aria-selected:text-violet-300 cursor-pointer transition-colors"
                                >
                                    <UserIcon size={18} className="text-cyan-400" />
                                    <span>{user.nome}</span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}
                </Command.List>
            </div>
        </Command.Dialog>
    );
};
