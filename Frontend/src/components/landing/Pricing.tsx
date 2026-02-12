import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const plans = [
    {
        name: "Padawan",
        price: "Grátis",
        description: "Para quem está começando a jornada.",
        features: [
            "Até 50 tarefas ativas",
            "Integração WhatsApp Básica",
            "IA SmartBot (Contexto Simples)",
            "Persona Padrão"
        ],
        cta: "Começar Grátis",
        popular: false
    },
    {
        name: "Jedi Master",
        price: "R$ 29,90",
        period: "/mês",
        description: "O poder total da produtividade.",
        features: [
            "Tarefas Ilimitadas",
            "IA Vision (Fotos e Documentos)",
            "Todas as Personas (Vader, Elsa...)",
            "Dashboard Pro com Insights",
            "Suporte Prioritário"
        ],
        cta: "Assinar Agora",
        popular: true
    },
    {
        name: "Galactic Empire",
        price: "Sob Consulta",
        description: "Para equipes e impérios.",
        features: [
            "Múltiplos Usuários",
            "API Personalizada",
            "Treinamento de IA Exclusivo",
            "SLA de 99.9%",
            "Gerente de Conta Dedicado"
        ],
        cta: "Falar com Vendas",
        popular: false
    }
];

export const Pricing = () => {
    return (
        <section id="pricing" className="py-20 px-4 relative overflow-hidden">
            <div className="container mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Escolha seu <span className="text-purple-400">Destino</span>
                    </h2>
                    <p className="text-slate-400">
                        Planos flexíveis para cada estágio da sua evolução.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.2 }}
                            className={`relative p-8 rounded-3xl border backdrop-blur-md flex flex-col ${plan.popular
                                ? 'bg-slate-900/80 border-purple-500 shadow-2xl shadow-purple-500/20 md:-translate-y-4'
                                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                                    MAIS POPULAR
                                </div>
                            )}

                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                {plan.period && <span className="text-slate-400 text-sm">{plan.period}</span>}
                            </div>
                            <p className="text-slate-400 mb-8 border-b border-slate-700/50 pb-8">
                                {plan.description}
                            </p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-400 shrink-0" />
                                        <span className="text-slate-300 text-sm">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    if (plan.price === 'Grátis') {
                                        window.location.href = '/login';
                                    } else if (plan.price === 'Sob Consulta') {
                                        window.open('https://wa.me/5511999999999?text=Tenho%20interesse%20no%20plano%20Enterprise', '_blank');
                                    } else {
                                        // Simulate purchase flow leading to registration
                                        window.location.href = '/login?plan=jedi';
                                    }
                                }}
                                id={`btn-${index}`}
                                className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 text-white shadow-lg'
                                    : 'bg-slate-800 text-white hover:bg-slate-700'
                                    }`}>
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
