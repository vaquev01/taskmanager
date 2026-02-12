import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Brain, Eye, UserPlus, Zap, Lock } from 'lucide-react';

const features = [
    {
        icon: <MessageCircle className="w-8 h-8 text-green-400" />,
        title: "Integração WhatsApp",
        description: "Sem apps extras. Gerencie tudo enviando mensagens de áudio ou texto para o bot."
    },
    {
        icon: <Brain className="w-8 h-8 text-purple-400" />,
        title: "IA Contextual",
        description: "O SmartBot entende 'Lembrar de comprar leite amanhã' e cria a tarefa com a data certa."
    },
    {
        icon: <Eye className="w-8 h-8 text-blue-400" />,
        title: "Visão Computacional",
        description: "Tire foto de um convite ou conta. A IA extrai os dados e agenda para você."
    },
    {
        icon: <UserPlus className="w-8 h-8 text-orange-400" />,
        title: "Personas Divertidas",
        description: "Seu gerente é o Darth Vader? Ou a Elsa? Escolha quem vai te cobrar as tarefas."
    },
    {
        icon: <Zap className="w-8 h-8 text-yellow-400" />,
        title: "Dashboard Pica das Galáxias",
        description: "Visualize suas métricas em um painel Glassmorphism digno de filme de ficção."
    },
    {
        icon: <Lock className="w-8 h-8 text-red-400" />,
        title: "Privacidade Total",
        description: "Seus dados são seus. Segurança de ponta a ponta e controle total."
    }
];

export const Features = () => {
    return (
        <section id="features" className="py-20 px-4 relative">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Poder <span className="text-cyan-400">Ilimitado</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        Tudo o que você precisa para dominar sua produtividade, direto no seu bolso.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-md hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all group"
                        >
                            <div className="mb-4 bg-slate-800/50 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
