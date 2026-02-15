import { useNavigate } from 'react-router-dom';
import {
    Zap,
    CheckCircle,
    BarChart3,
    Users,
    ArrowRight,
    ShieldCheck,
    MessageSquare,
    Bot
} from 'lucide-react';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] overflow-x-hidden font-sans selection:bg-violet-500/30">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-white/5 bg-[var(--bg-app)]/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-tr from-violet-600 to-cyan-500 p-2 rounded-xl">
                            <Zap size={24} className="text-white fill-current" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">TaskFlow</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                            Entrar
                        </button>
                        <button
                            onClick={() => navigate('/login')} // In real app, maybe /register
                            className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            Começar Grátis <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
                {/* Background Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-8">
                        <SparkleIcon /> Novo: Integração com WhatsApp IA
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                        Gerencie tarefas com <br />
                        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                            Inteligência Artificial
                        </span>
                    </h1>

                    <p className="text-xl text-[var(--text-muted)] mb-10 max-w-2xl mx-auto leading-relaxed">
                        O TaskFlow unifica sua equipe, projetos e comunicação em uma única plataforma poderosa.
                        Automatize o caos e foque no que importa.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 group"
                        >
                            Começar Agora
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            className="w-full sm:w-auto px-8 py-4 bg-[var(--card-bg)] hover:bg-[var(--card-border)] border border-[var(--card-border)] text-[var(--text-main)] rounded-2xl font-semibold text-lg transition-all"
                        >
                            Ver Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6 bg-black/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Tudo que você precisa</h2>
                        <p className="text-[var(--text-muted)]">Uma suíte completa para alta performance.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Bot size={32} className="text-emerald-400" />}
                            title="IA via WhatsApp"
                            desc="Crie tarefas, consulte sua agenda e gerencie equipes enviando áudios ou textos no WhatsApp."
                        />
                        <FeatureCard
                            icon={<BarChart3 size={32} className="text-blue-400" />}
                            title="Analytics em Tempo Real"
                            desc="Dashboards visuais com métricas de produtividade, gargalos e desempenho da equipe."
                        />
                        <FeatureCard
                            icon={<Users size={32} className="text-violet-400" />}
                            title="Colaboração Fluida"
                            desc="Comentários, menções e notificações push para manter todos na mesma página."
                        />
                        <FeatureCard
                            icon={<ShieldCheck size={32} className="text-rose-400" />}
                            title="Segurança Enterprise"
                            desc="Criptografia de ponta a ponta e controle de acesso granular para sua empresa."
                        />
                        <FeatureCard
                            icon={<Zap size={32} className="text-amber-400" />}
                            title="Automação de Workflow"
                            desc="Gatine tarefas recorrentes e processos automáticos para economizar tempo."
                        />
                        <FeatureCard
                            icon={<MessageSquare size={32} className="text-cyan-400" />}
                            title="Chat Integrado"
                            desc="Discuta detalhes das tarefas sem sair do contexto ou mudar de aba."
                        />
                    </div>
                </div>
            </section>

            {/* Social Proof */}
            <section className="py-24 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-12">Confiado por times de alta performance</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <TestimonialCard
                            quote="O TaskFlow revolucionou nossa operação. A integração com WhatsApp é simplesmente mágica."
                            author="Ana Silva"
                            role="CEO, TechStart"
                        />
                        <TestimonialCard
                            quote="Simples, bonito e extremamente poderoso. O melhor gerenciador que já usamos."
                            author="Carlos Mendes"
                            role="Product Manager, Loggi"
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-white/5 bg-black/40">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-violet-500" />
                        <span className="font-bold text-[var(--text-main)]">TaskFlow</span>
                    </div>
                    <div className="text-[var(--text-muted)] text-sm">
                        © 2026 TaskFlow Inc. Todos os direitos reservados.
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="text-[var(--text-muted)] hover:text-white transition-colors">Termos</a>
                        <a href="#" className="text-[var(--text-muted)] hover:text-white transition-colors">Privacidade</a>
                        <a href="#" className="text-[var(--text-muted)] hover:text-white transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Helper Components
const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-8 rounded-3xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-violet-500/30 transition-all hover:translate-y-[-4px] group">
        <div className="mb-6 p-3 bg-white/5 w-fit rounded-2xl group-hover:bg-white/10 transition-colors">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-[var(--text-main)]">{title}</h3>
        <p className="text-[var(--text-muted)] leading-relaxed">{desc}</p>
    </div>
);

const TestimonialCard = ({ quote, author, role }: { quote: string, author: string, role: string }) => (
    <div className="p-8 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 text-left">
        <div className="flex gap-1 mb-4 text-emerald-400">
            {[1, 2, 3, 4, 5].map(i => <CheckCircle key={i} size={16} fill="currentColor" className="text-emerald-400" />)}
        </div>
        <p className="text-lg mb-6 text-[var(--text-main)]">"{quote}"</p>
        <div>
            <div className="font-bold text-white">{author}</div>
            <div className="text-sm text-[var(--text-muted)]">{role}</div>
        </div>
    </div>
);

const SparkleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
