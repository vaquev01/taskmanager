import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-cyan-400 mb-8 hover:text-cyan-300 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Voltar
                </button>

                <h1 className="text-4xl font-bold text-white mb-8">Termos de Uso e Política de Privacidade</h1>

                <section className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">1. Introdução</h2>
                    <p>
                        Bem-vindo ao TaskFlow. Ao utilizar nosso sistema, você concorda com estes termos.
                        Garantimos a segurança e integridade dos seus dados conforme as leis vigentes (LGPD).
                    </p>

                    <h2 className="text-2xl font-bold text-white">2. Uso do Serviço</h2>
                    <p>
                        O TaskFlow é uma ferramenta de produtividade. O uso indevido para spam ou atividades ilícitas resultará no bloqueio imediato da conta.
                    </p>

                    <h2 className="text-2xl font-bold text-white">3. Assinaturas e Pagamentos</h2>
                    <p>
                        Os pagamentos são processados via Stripe. O cancelamento pode ser feito a qualquer momento.
                        Não realizamos reembolsos parciais.
                    </p>

                    <h2 className="text-2xl font-bold text-white">4. Direitos Autorais</h2>
                    <p>
                        Todo o código, design e marca TaskFlow são propriedade exclusiva da TaskFlow Inc.
                        É proibida a cópia ou engenharia reversa.
                    </p>

                    <h2 className="text-2xl font-bold text-white">5. Contato</h2>
                    <p>
                        Em caso de dúvidas, entre em contato com nosso suporte técnico ou jurídico.
                    </p>

                    <div className="pt-8 border-t border-slate-800 text-sm text-slate-500">
                        Última atualização: {new Date().toLocaleDateString()}
                    </div>
                </section>
            </div>
        </div>
    );
};
