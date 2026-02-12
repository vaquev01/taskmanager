import { motion } from 'framer-motion';
import { ArrowRight, Zap, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-16">
            {/* Fixed Login Button — always on top */}
            <a
                href="/login"
                className="fixed top-6 right-6 z-[9999] px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full font-bold text-base backdrop-blur-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/30"
                style={{ textDecoration: 'none' }}
            >
                <ArrowRight className="w-4 h-4" />
                Área do Cliente
            </a>

            <div className="container mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-wider text-cyan-400 uppercase bg-cyan-900/30 rounded-full border border-cyan-500/30 backdrop-blur-sm">
                        O Futuro da Produtividade
                    </span>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white drop-shadow-lg">
                        Seu Segundo Cérebro <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
                            Turbinado por IA
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Gerencie tarefas pelo WhatsApp, converse com personas e deixe a IA organizar sua vida.
                        Simples como uma mensagem, poderoso como um sistema enterprise.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all"
                        >
                            <Rocket className="w-5 h-5" />
                            Começar Agora Gratuitamente
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, borderColor: '#38bdf8' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800/80 text-white border border-slate-700 rounded-xl font-bold text-lg backdrop-blur-sm flex items-center gap-2 transition-all"
                        >
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Ver Funcionalidades
                        </motion.button>
                    </div>
                </motion.div>

                {/* Phone Mockup Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="mt-16 relative group max-w-[300px] mx-auto"
                >
                    {/* Floating Glow Behind */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[110%] bg-gradient-to-tr from-cyan-500/40 to-purple-600/40 blur-3xl rounded-full opacity-60 animate-pulse" />

                    {/* Phone Frame */}
                    <div className="relative z-10 bg-gray-950 border-[8px] border-gray-900 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20 flex justify-center items-center">
                            <div className="w-16 h-1 bg-gray-800 rounded-full" />
                            <div className="absolute right-6 w-1.5 h-1.5 bg-gray-800 rounded-full" />
                        </div>

                        {/* Screen Content: WhatsApp Simulation */}
                        <div className="relative aspect-[9/19] bg-[#0b141a] overflow-hidden flex flex-col font-sans">
                            {/* Status Bar Mockup */}
                            <div className="h-6 bg-[#0b141a] flex justify-between items-center px-4 pt-1">
                                <span className="text-[10px] text-white font-medium">9:41</span>
                                <div className="flex gap-1">
                                    <div className="w-2.5 h-2.5 bg-white rounded-full opacity-20" />
                                    <div className="w-2.5 h-2.5 bg-white rounded-full opacity-20" />
                                    <div className="w-4 h-2.5 bg-white rounded-full opacity-80" />
                                </div>
                            </div>

                            {/* WhatsApp Header */}
                            <div className="bg-[#202c33] px-3 py-2 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                                    TF
                                </div>
                                <div className="flex-1">
                                    <div className="text-white text-xs font-semibold">TaskFlow Bot</div>
                                    <div className="text-[#8696a0] text-[10px]">online</div>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 bg-[#0b141a] p-3 flex flex-col gap-3 overflow-hidden relative">
                                {/* Chat Background Pattern */}
                                <div className="absolute inset-0 opacity-5 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat" />

                                {/* Date Divider */}
                                <div className="flex justify-center z-10">
                                    <span className="bg-[#182229] text-[#8696a0] text-[10px] px-2 py-1 rounded-lg shadow-sm">
                                        Hoje
                                    </span>
                                </div>

                                {/* User Message */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.5 }}
                                    className="self-end bg-[#005c4b] text-white p-2 rounded-lg rounded-tr-none max-w-[85%] shadow-sm z-10 text-[11px] leading-snug"
                                >
                                    <div className="mb-1">Agendar reunião de equipe com @Sarah e @João amanhã às 14h</div>
                                    <div className="text-[9px] text-[#8696a0] text-right flex items-center justify-end gap-1">
                                        09:42 <span className="text-[#53bdeb] text-[10px]">✓✓</span>
                                    </div>
                                </motion.div>

                                {/* Bot Response (Typing first) */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2.5, duration: 0.5 }}
                                    className="self-start bg-[#202c33] text-white p-2 rounded-lg rounded-tl-none max-w-[85%] shadow-sm z-10 text-[11px] border border-transparent"
                                >
                                    <motion.div
                                        initial={{ display: 'flex' }}
                                        animate={{ display: 'none' }}
                                        transition={{ delay: 3.5 }}
                                        className="flex gap-1 p-1"
                                    >
                                        <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce delay-75" />
                                        <div className="w-1.5 h-1.5 bg-[#8696a0] rounded-full animate-bounce delay-150" />
                                    </motion.div>

                                    <motion.div
                                        initial={{ display: 'none' }}
                                        animate={{ display: 'block' }}
                                        transition={{ delay: 3.5 }}
                                    >
                                        <div className="font-bold text-green-400 mb-1 text-[10px]">✅ Tarefa Criada</div>
                                        <div className="mb-1">
                                            Reunião de Equipe<br />
                                            📅 Amanhã, 14:00<br />
                                            👥 Sarah, João
                                        </div>
                                        <div className="text-[9px] text-[#8696a0] text-right">09:42</div>
                                    </motion.div>
                                </motion.div>

                                {/* Notification Popup Simulation */}
                                <motion.div
                                    initial={{ y: -50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 5, duration: 0.5 }}
                                    className="absolute top-2 left-2 right-2 bg-[#202c33]/95 backdrop-blur-md border border-gray-700/50 p-2 rounded-xl z-50 shadow-2xl flex items-center gap-2"
                                >
                                    <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                                        <Zap className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-bold text-white">Lembrete TaskFlow</div>
                                        <div className="text-[9px] text-gray-300 truncate">Reunião em 10 minutos! Preparar pauta.</div>
                                    </div>
                                </motion.div>

                            </div>

                            {/* Input Area */}
                            <div className="bg-[#202c33] p-2 flex items-center gap-2 z-20">
                                <div className="w-6 h-6 rounded-full bg-[#8696a0]/20 flex items-center justify-center">
                                    <div className="text-[#8696a0] text-xs">+</div>
                                </div>
                                <div className="flex-1 h-7 bg-[#2a3942] rounded-full px-3 flex items-center text-[#8696a0] text-[10px]">
                                    Mensagem
                                </div>
                                <div className="w-6 h-6 rounded-full bg-[#00a884] flex items-center justify-center">
                                    <div className="text-white text-[9px]">➤</div>
                                </div>
                            </div>

                            {/* Reflection Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-30" />
                        </div>

                        {/* Power/Volume Buttons */}
                        <div className="absolute top-24 -right-2.5 w-1 h-12 bg-gray-800 rounded-r-md" />
                        <div className="absolute top-24 -left-2.5 w-1 h-8 bg-gray-800 rounded-l-md" />
                        <div className="absolute top-36 -left-2.5 w-1 h-12 bg-gray-800 rounded-l-md" />
                    </div>
                </motion.div>
            </div>

            {/* Floating Glow Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl -z-10 opacity-30 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/30 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
            >
                <ArrowRight className="w-6 h-6 rotate-90" />
            </motion.div>
        </section>
    );
};
