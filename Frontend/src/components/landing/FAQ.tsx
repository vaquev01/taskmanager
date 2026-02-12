import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        question: "Como funciona a integração com o WhatsApp?",
        answer: "Simples. Você adiciona nosso número aos contatos, envia uma mensagem e pronto. O SmartBot identifica quem você é e começa a gerenciar suas tarefas."
    },
    {
        question: "Preciso baixar algum aplicativo?",
        answer: "Não! Tudo acontece no WhatsApp. Você só usa nosso painel web se quiser ver relatórios detalhados ou configurações avançadas."
    },
    {
        question: "Meus dados estão seguros?",
        answer: "Sim. Utilizamos criptografia de ponta a ponta e seguimos rigorosamente a LGPD. Seus dados são seus."
    },
    {
        question: "Posso cancelar quando quiser?",
        answer: "Com certeza. Sem contratos de fidelidade. Você é livre para entrar e sair quando desejar."
    },
    {
        question: "Serve para equipes?",
        answer: "Sim! Os planos Pro e Enterprise permitem criar times, atribuir tarefas a colegas e ver a produtividade do grupo."
    }
];

export const FAQ = () => {
    return (
        <section className="py-20 px-4 relative bg-slate-900/30">
            <div className="container mx-auto max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Dúvidas <span className="text-purple-400">Frequentes</span>
                    </h2>
                    <p className="text-slate-400">
                        Tudo o que você precisa saber antes de começar.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <AccordionItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const AccordionItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-slate-800 rounded-2xl bg-slate-950/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-900/50 transition-colors"
            >
                <span className="font-bold text-lg text-white">{question}</span>
                {isOpen ? <ChevronUp className="text-purple-400" /> : <ChevronDown className="text-slate-500" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 text-slate-400 leading-relaxed border-t border-slate-800/50">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
